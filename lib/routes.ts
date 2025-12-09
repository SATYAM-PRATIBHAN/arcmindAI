export const DOC_ROUTES = {
  SOCIAL: {
    GITHUB: "https://github.com/SATYAM-PRATIBHAN/arcmindAI",
    LINKEDIN: "https://www.linkedin.com/in/satyampratibhan/",
    X: "https://x.com/s_pratibhan",
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
    PAYMENT: {
      ROOT: "/api/payment",
      WEBHOOK: "/api/payment/webhook",
    },
    GRIEVANCE: "/api/grievance",
    GENERATE: {
      ROOT: "/api/generate",
      HISTORY: "/api/generate/history",
    },
    GITHUB: {
      TOKEN: "/api/github/token",
      STATUS: "/api/github/status",
      REPOS: "/api/github/repos",
      REPO_INFO: "/api/github/repo-info",
      REPO_TREE: "/api/github/repo-tree",
      FILE_CONTENT: "/api/github/file-content",
      GENERATION: (id: string) => `/api/github-generation/${id}`,
      IMPROVE_DIAGRAM: (id: string) =>
        `/api/github-generation/${id}/improve-diagram`,
      ANALYZE_REPOSITORY: "/api/analyze-repository",
      GENERATE_DESIGN: "/api/generate-github-design",
    },
    METRICS: "/api/metrics",
    SEND_MAIL: "/api/send-mail",
    USER: "/api/user",
  },
  IMPORT: {
    ROOT: "/import",
    UPDATE: (id: string) => `/import/update/${id}`,
  },
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/login",
    SIGN_UP: "/auth/signup",
    VERIFY_REQUEST: "/auth/verify-request",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  PROFILE: {
    ROOT: "/profile",
    CANCEL_SUBSCRIPTION: "/profile/subscription-cancel",
  },
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
