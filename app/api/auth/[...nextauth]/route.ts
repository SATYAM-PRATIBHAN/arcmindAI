import NextAuth, { AuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";
import { db } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/jwt";
import { loginRateLimitIP, loginRateLimitAccount } from "@/lib/rateLimit";
import { encryptToken } from "@/lib/encryption";
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
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
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
    async signIn({ account }) {
      // Handle GitHub OAuth sign-in
      if (account?.provider === "github" && account.access_token) {
        try {
          // Get the current session to find the logged-in user
          const session = await getServerSession(authOptions);

          if (session?.user) {
            // User is already logged in with credentials
            // Link GitHub account to their existing account
            const email = session.user?.email;

            if (email) {
              // Encrypt the GitHub access token before storing
              const encryptedToken = encryptToken(account.access_token);

              await db.user.update({
                where: { email: email },
                data: { githubAccessToken: encryptedToken },
              });

              // Redirect back to import page with success message
              return "/import?github=linked";
            }
          }

          // No active session - user must be logged in first
          return "/auth/login?error=MustLoginFirst";
        } catch (error) {
          console.error("Error linking GitHub account:", error);
          return "/import?error=LinkFailed";
        }
      }

      // Allow credentials sign-in
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name || user.email?.split("@")[0];
        token.email = user.email;
        // @ts-expect-error accessToken is added in authorize
        token.accessToken = user.accessToken;
      }

      // Note: We do NOT fetch or expose the GitHub token in JWT/session
      // The token stays encrypted in the database and is only decrypted
      // server-side when needed for GitHub API calls

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
        // Note: We do NOT expose githubAccessToken in the session for security
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
