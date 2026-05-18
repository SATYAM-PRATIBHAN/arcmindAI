# ArcMind AI - AI-Powered System Design Generator

Generate structured system designs using AI. Describe your requirements and get detailed architecture diagrams, components, and tech stacks powered by Gemini and LangChain. Import GitHub repositories for automated system design generation.

> [!IMPORTANT]
>
> ## GSSoC 2026 Contributors
>
> This project is participating in **GirlScript Summer of Code 2026**.
>
> * Please **comment on an issue first** to request assignment before starting work.
> * Wait for confirmation before opening a PR to avoid duplicate contributions.
> * For contribution rules, announcements, and questions, please use the pinned discussion:
>   [GSSoC 2026 Discussion](https://github.com/SATYAM-PRATIBHAN/arcmindAI/discussions/120)
>
> Please also read the contribution guidelines before submitting changes.

## Features

* **AI-Powered Generation**: Leverage Google Gemini and LangChain to create comprehensive system designs from natural language descriptions
* **Task Generation**: AI-powered task breakdown that converts system architectures into actionable development tasks

  * Automatic task categorization (Frontend, Backend, Database, etc.)
  * Priority assignment (high, medium, low)
  * Time estimates for each task
  * Dependency tracking between tasks
  * Cached results for instant retrieval
* **GitHub Integration**: Import and analyze GitHub repositories to automatically generate system architecture diagrams

  * Secure OAuth authentication with GitHub
  * Repository browsing and file exploration
  * Automated repository analysis and design generation
  * Encrypted token storage for maximum security
* **Webhook Support**: Receive real-time notifications for AI generation lifecycle events

  * Webhook endpoint registration and management dashboard
  * Support for `generation.completed` and `generation.failed` events
  * HMAC SHA-256 webhook payload signing using `x-webhook-signature`
  * HTTPS-only webhook URL validation
  * Delivery status tracking and async dispatching with `Promise.allSettled`
* **User Authentication**: Secure signup/login with OTP verification, password reset, and profile management
* **Generation History**: Track and manage all your previous system design generations
* **Rate Limiting**: Built-in rate limiting to ensure fair usage (1 request per 2 minutes per user)
* **Metrics & Monitoring**: Prometheus metrics for monitoring AI generation performance, user activity, and system health
* **Contact Form**: Integrated contact form with email notifications
* **Responsive UI**: Modern, responsive interface built with Next.js, React, and Tailwind CSS
* **Database**: MongoDB with Prisma ORM for robust data management

## Webhooks

ArcMindAI supports webhook notifications for AI generation lifecycle events.

### Supported Events

* `generation.completed`
* `generation.failed`

### Security Features

* HTTPS-only webhook URL validation
* HMAC SHA-256 payload signing using `x-webhook-signature`
* Signed payload verification support for consumers

### Delivery Features

* Async webhook dispatching
* Delivery status tracking
* Batched webhook execution using `Promise.allSettled`

### Webhook Dashboard

Users can:

* register webhook endpoints
* manage webhook subscriptions
* monitor webhook delivery status
* view delivery success/failure history

## Tech Stack

* **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
* **Backend**: Next.js API Routes
* **Database**: MongoDB with Prisma ORM
* **Authentication**: NextAuth.js with GitHub OAuth
* **AI**: Google Gemini AI, LangChain
* **UI Components**: Radix UI, Shadcn/ui
* **Email**: Nodemailer
* **Rate Limiting**: Upstash Redis
* **Monitoring**: Prometheus Client
* **Security**: AES-256-GCM encryption for sensitive data
* **Deployment**: Vercel-ready

## Prerequisites

* Node.js 18+
* pnpm (recommended) or npm/yarn
* MongoDB database
* Google AI API key
* GitHub OAuth App (for repository import)
* Redis (for rate limiting, optional for development)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/SATYAM-PRATIBHAN/arcmindAI.git
cd arcmindAI
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` or `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:

### Database & Authentication

* `DATABASE_URL`: MongoDB connection string
* `NEXTAUTH_SECRET`: Secret for NextAuth session encryption
* `NEXTAUTH_URL`: Application URL
* `JWT_SECRET`: JWT signing secret

### Google OAuth & AI

* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* `GOOGLE_REFRESH_TOKEN`
* `GOOGLE_REDIRECT_URI`
* `GEMINI_API_KEY`

### GitHub Integration

* `GITHUB_CLIENT_ID`
* `GITHUB_CLIENT_SECRET`
* `ENCRYPTION_KEY`: 32-byte encryption key for secure token storage

### Rate Limiting

* `UPSTASH_REDIS_REST_URL`
* `UPSTASH_REDIS_REST_TOKEN`

### Request Limits

* `API_BODY_LIMIT_BYTES`: Maximum allowed request body size in bytes for `/api/*` routes

### Email & Media

* `ADMIN_EMAIL`
* `CLOUDINARY_CLOUD_NAME`
* `CLOUDINARY_API_KEY`
* `CLOUDINARY_API_SECRET`

### Public

* `NEXT_PUBLIC_BASE_URL`

4. Set up the database:

```bash
pnpm prisma generate
pnpm prisma db push
```

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Authentication

* Sign up with email verification
* Login with email/password
* OTP verification for account security
* Password reset functionality

### AI Generation

* Navigate to the generate page
* Describe your system requirements in natural language
* Receive structured system design with architecture diagrams, components, and tech stack recommendations

### GitHub Repository Import

1. **Connect GitHub Account**

   * Navigate to the Import page
   * Click "Connect GitHub" to authenticate via OAuth
   * Your GitHub access token is encrypted and stored securely

2. **Browse Repositories**

   * View all your GitHub repositories
   * Search and filter repositories
   * Select a repository to import

3. **Explore Repository**

   * Browse repository file structure
   * View file contents directly in the browser
   * Supports both text files and images

4. **Generate System Design**

   * Click "Generate System Design" to analyze the repository
   * AI automatically analyzes:

     * Architecture patterns and structure
     * Dependencies and frameworks
     * Database schemas and ORMs
     * API endpoints and routes
     * Infrastructure and deployment configs
     * Testing frameworks
   * Receive a comprehensive Mermaid architecture diagram

5. **Update Designs**

   * Edit generated Mermaid diagrams
   * Save changes to the database
   * Reset to original if needed

### Task Generation

After generating a system design (either from natural language or GitHub import), you can get an AI-powered task breakdown:

1. **Access Task Breakdown**

   * Navigate to any generated design
   * Click on the "Tasks" or "View Tasks" button
   * AI automatically generates tasks if not already cached

2. **Task Organization**

   * Tasks are automatically categorized by area (Frontend, Backend, Database, DevOps, etc.)
   * Each task includes:

     * **Title**: Clear, actionable task name
     * **Description**: Detailed explanation of what needs to be done
     * **Priority**: High, medium, or low priority assignment
     * **Estimated Hours**: Time estimate for completion
     * **Dependencies**: Other tasks that must be completed first

3. **Project Overview**

   * View total task count
   * See total estimated hours
   * Track high-priority tasks
   * Monitor progress by category

4. **Caching**

   * Generated tasks are cached in the database
   * Instant retrieval on subsequent visits
   * Consistent task breakdown for team collaboration

### Webhook Management

* Register secure webhook endpoints
* Receive notifications for generation success/failure events
* Monitor delivery status from the webhook dashboard
* Verify payload authenticity using HMAC signatures

### History

* View all previous generations
* Filter and search through your design history

### Metrics

* Access metrics dashboard for generation statistics
* Monitor AI performance and user activity

## Security Features

### GitHub Token Protection

* **Encrypted Storage**: All GitHub access tokens are encrypted using AES-256-GCM before storage
* **Server-Side Operations**: GitHub API calls are proxied through backend endpoints
* **No Frontend Exposure**: Tokens never reach the frontend or client-side code
* **Secure Proxy Endpoints**:

  * `/api/github/status` - Check connection status
  * `/api/github/repos` - Fetch user repositories
  * `/api/github/repo-info` - Get repository information
  * `/api/github/repo-tree` - Fetch repository file tree
  * `/api/github/file-content` - Get file contents
  * `/api/analyze-repository` - Analyze repository structure

### Webhook Security

* Webhook payloads are signed using HMAC SHA-256
* HTTPS-only webhook URL validation
* Delivery tracking for auditing and debugging
* Isolated async delivery execution

## Scripts

* `pnpm dev` - Start development server
* `pnpm build` - Build for production
* `pnpm start` - Start production server
* `pnpm lint` - Run ESLint
* `pnpm format` - Format code with Prettier
* `pnpm prisma:studio` - Open Prisma Studio for database management
* `pnpm prisma:generate` - Generate Prisma Client
* `pnpm prisma:push` - Push schema changes to database

## Development Workflow

This project uses **Husky** and **lint-staged** to ensure code quality. A pre-commit hook automatically runs:

1. **ESLint** with `--fix` to catch and fix linting errors.
2. **Prettier** to ensure consistent code formatting.

This happens automatically whenever you run `git commit`. If there are unfixable errors, the commit will be blocked until they are resolved.

## Deployment

The easiest way to deploy your Next.js app is to use the Vercel Platform.

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in the Vercel dashboard
4. Make sure to add the `ENCRYPTION_KEY` environment variable
5. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
