export const DOC_ROUTES = {
  SOCIAL: {
    GITHUB: "https://github.com/SATYAM-PRATIBHAN/arcmindAI",
    LINKEDIN: "https://www.linkedin.com/in/satyampratibhan/",
    X: "https://x.com/s_pratibhan",
    PORTFOLIO: "https://satyampratibhan.vercel.app/",
  },
  API: {
    AUTH: {
      RESEND_OTP: "/api/auth/resend-otp",
      SIGNUP: "/api/auth/signup",
      VERIFY_OTP: "/api/auth/verify-otp",
      UPDATE_PASSWORD: "/api/auth/updatePassword",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      RESET_PASSWORD: "/api/auth/reset-password",
    },
    GENERATE: {
      ROOT: "/api/generate",
      HISTORY: "/api/generate/history",
    },
    METRICS: "/api/metrics",
    SEND_MAIL: "/api/send-mail",
    USER: "/api/user",
  },
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/login",
    SIGN_UP: "/auth/signup",
    VERIFY_REQUEST: "/auth/verify-request",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  PROFILE: "/profile",
  GENERATE: "/generate",
  ABOUT: "/about",
  PRICING: "/pricing",
  CONTACT: "/contact",
  PRIVACY_POLICY: "/privacy",
} as const;

type PathValue = string | ((...args: string[]) => string);
type FlatRoutes = string[];

const flattenRoutes = (
  obj: Record<string, PathValue | Record<string, unknown>>,
): FlatRoutes => {
  if (!obj) return [];
  return Object.values(obj).reduce<FlatRoutes>((acc, value) => {
    if (typeof value === "string") {
      acc.push(value);
    } else if (typeof value === "function") {
      // Dynamic routes are skipped for flattening
    } else if (typeof value === "object" && value !== null) {
      acc.push(
        ...flattenRoutes(
          value as Record<string, PathValue | Record<string, unknown>>,
        ),
      );
    }
    return acc;
  }, []);
};

export const ALL_DOC_ROUTES: FlatRoutes = flattenRoutes(DOC_ROUTES);

export const isDocRoute = (
  path: string,
): path is (typeof ALL_DOC_ROUTES)[number] => ALL_DOC_ROUTES.includes(path);
