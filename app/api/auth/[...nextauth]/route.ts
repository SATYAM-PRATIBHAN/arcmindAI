import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/jwt";
import { loginRateLimitIP, loginRateLimitAccount } from "@/lib/rateLimit";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLoginsTotal,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "abc@example.com",
        },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        const startTime = Date.now();
        const route = "/api/auth/[...nextauth]";
        const method = "POST"; // Assuming login is POST
        httpRequestsTotal.inc({ route, method });

        try {
          if (!credentials?.email || !credentials.password) {
            apiGatewayErrorsTotal.inc({ status_code: "400" });
            httpRequestDurationSeconds.observe(
              { route },
              (Date.now() - startTime) / 1000,
            );
            throw new Error("Missing email or password");
          }

          // Get client IP
          const ip =
            req?.headers?.["x-forwarded-for"] ||
            req?.headers?.["x-real-ip"] ||
            "unknown";

          // Rate limit by IP
          const ipLimitResult = await loginRateLimitIP.limit(ip);
          if (!ipLimitResult.success) {
            apiGatewayErrorsTotal.inc({ status_code: "429" });
            httpRequestDurationSeconds.observe(
              { route },
              (Date.now() - startTime) / 1000,
            );
            throw new Error(
              "Too many login attempts from this IP. Please try again later.",
            );
          }

          const dbStart = Date.now();
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });
          databaseQueryDurationSeconds.observe(
            { operation: "findUnique" },
            (Date.now() - dbStart) / 1000,
          );

          if (!user) {
            apiGatewayErrorsTotal.inc({ status_code: "404" });
            httpRequestDurationSeconds.observe(
              { route },
              (Date.now() - startTime) / 1000,
            );
            throw new Error("User not found");
          }

          // Rate limit by account (email)
          const accountLimitResult = await loginRateLimitAccount.limit(
            credentials.email,
          );
          if (!accountLimitResult.success) {
            apiGatewayErrorsTotal.inc({ status_code: "429" });
            httpRequestDurationSeconds.observe(
              { route },
              (Date.now() - startTime) / 1000,
            );
            throw new Error(
              "Too many login attempts for this account. Please try again later.",
            );
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!isValid) {
            apiGatewayErrorsTotal.inc({ status_code: "401" });
            httpRequestDurationSeconds.observe(
              { route },
              (Date.now() - startTime) / 1000,
            );
            throw new Error("Invalid credentials");
          }

          // Increment login counter
          userLoginsTotal.inc();

          // Update user activity
          userLastActivityTimestamp.set(
            { user_id: user.id },
            Date.now() / 1000,
          );

          const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            name: user.username,
          });

          httpRequestDurationSeconds.observe(
            { route },
            (Date.now() - startTime) / 1000,
          );

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            accessToken,
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          throw error;
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name || user.email?.split("@")[0];
        token.email = user.email;
        // @ts-expect-error accessToken is added in authorize
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        // @ts-expect-error NextAuth session.user type does not include id by default
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        // @ts-expect-error Adding accessToken to session
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
