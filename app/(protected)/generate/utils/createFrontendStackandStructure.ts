export const FRONTEND_GENERATION_PROMPT = `You are a senior frontend architect. Given a backend system design, generate a comprehensive frontend architecture that integrates seamlessly with the backend.

Analyze the backend system and produce a JSON response with the following structure:

{
  "stack": {
    "framework": "Next.js 14 (App Router)",
    "language": "TypeScript",
    "styling": ["Tailwind CSS", "CSS Modules"],
    "stateManagement": "Zustand or React Context",
    "formHandling": "React Hook Form + Zod",
    "dataFetching": "TanStack Query or SWR",
    "authentication": "NextAuth.js",
    "uiLibrary": ["shadcn/ui", "Radix UI"],
    "testing": ["Jest", "React Testing Library", "Playwright"],
    "buildTools": ["ESLint", "Prettier", "Husky"]
  },
  "structure": {
    "pages": [
      {
        "path": "/dashboard",
        "name": "Dashboard",
        "description": "Main dashboard showing user overview",
        "components": ["DashboardHeader", "StatsCards", "ActivityFeed"],
        "apiIntegrations": ["/api/users/{userId}", "/api/stats"]
      }
    ],
    "components": [
      {
        "name": "Navbar",
        "type": "layout",
        "description": "Main navigation component",
        "props": { "user": "User | null" }
      }
    ],
    "hooks": ["useAuth", "useUser", "useToast"],
    "services": ["authService", "userService", "apiClient"],
    "types": ["User", "ApiResponse", "FormState"],
    "utils": ["formatDate", "validateEmail", "cn"]
  },
  "fileTree": [
    "src/app/(auth)/login/page.tsx",
    "src/app/(auth)/register/page.tsx",
    "src/app/(protected)/dashboard/page.tsx",
    "src/components/ui/button.tsx",
    "src/components/layout/navbar.tsx",
    "src/hooks/useAuth.ts",
    "src/services/apiClient.ts",
    "src/types/index.ts",
    "src/lib/utils.ts"
  ],
  "recommendations": [
    "Use server components for data fetching where possible",
    "Implement optimistic updates for better UX",
    "Add proper loading and error states for all API calls"
  ]
}

RULES:
1. Match the frontend pages to the backend API routes
2. Create components that handle the entities from the backend
3. Generate hooks for each major feature/service
4. Include proper TypeScript types based on backend entities
5. Consider the authentication method from the backend
6. Suggest appropriate state management based on complexity
7. Include both layout and feature components
8. Generate a realistic file tree following Next.js 14 App Router conventions
9. Return ONLY valid JSON, no markdown or explanations

BACKEND SYSTEM DESIGN:
`;
