# ArcMind AI - AI-Powered System Design Generator

Generate structured system designs using AI. Describe your requirements and get detailed architecture diagrams, components, and tech stacks powered by Gemini and LangChain. Import GitHub repositories for automated system design generation.

## Features

- **AI-Powered Generation**: Leverage Google Gemini and LangChain to create comprehensive system designs from natural language descriptions
- **Task Generation**: AI-powered task breakdown that converts system architectures into actionable development tasks
  - Automatic task categorization (Frontend, Backend, Database, etc.)
  - Priority assignment (high, medium, low)
  - Time estimates for each task
  - Dependency tracking between tasks
  - Cached results for instant retrieval
- **GitHub Integration**: Import and analyze GitHub repositories to automatically generate system architecture diagrams
  - Secure OAuth authentication with GitHub
  - Repository browsing and file exploration
  - Automated repository analysis and design generation
  - Encrypted token storage for maximum security
- **User Authentication**: Secure signup/login with OTP verification, password reset, and profile management
- **Generation History**: Track and manage all your previous system design generations
- **Rate Limiting**: Built-in rate limiting to ensure fair usage (1 request per 2 minutes per user)
- **Metrics & Monitoring**: Prometheus metrics for monitoring AI generation performance, user activity, and system health
- **Contact Form**: Integrated contact form with email notifications
- **Responsive UI**: Modern, responsive interface built with Next.js, React, and Tailwind CSS
- **Database**: MongoDB with Prisma ORM for robust data management

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js with GitHub OAuth
- **AI**: Google Gemini AI, LangChain
- **UI Components**: Radix UI, Shadcn/ui
- **Email**: Nodemailer
- **Rate Limiting**: Upstash Redis
- **Monitoring**: Prometheus Client
- **Security**: AES-256-GCM encryption for sensitive data
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- MongoDB database
- Google AI API key
- GitHub OAuth App (for repository import)
- Redis (for rate limiting, optional for development)

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

**Database & Authentication:**

- `DATABASE_URL`: MongoDB connection string (example: `mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname`)
- `NEXTAUTH_SECRET`: A random string used for NextAuth session encryption
- `NEXTAUTH_URL`: Your application URL (e.g., `http://localhost:3000` for development)
- `JWT_SECRET`: Secret key for JWT token signing

**Google OAuth & AI:**

- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID (for login)
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret
- `GOOGLE_REFRESH_TOKEN`: For server-side Google API access
- `GOOGLE_REDIRECT_URI`: Redirect URI registered with Google
- `GEMINI_API_KEY`: Google Gemini AI API Key

**GitHub Integration:**

- `GITHUB_CLIENT_ID`: GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret
- `ENCRYPTION_KEY`: 32-byte encryption key for secure token storage (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

**Rate Limiting:**

- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST API URL (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token

**Email & Media:**

- `ADMIN_EMAIL`: Email of the admin (notifications, etc.)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image uploads
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

**Public:**

- `NEXT_PUBLIC_BASE_URL`: Public base URL of the deployed app

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

- Sign up with email verification
- Login with email/password
- OTP verification for account security
- Password reset functionality

### AI Generation

- Navigate to the generate page
- Describe your system requirements in natural language
- Receive structured system design with architecture diagrams, components, and tech stack recommendations

### GitHub Repository Import

1. **Connect GitHub Account**
   - Navigate to the Import page
   - Click "Connect GitHub" to authenticate via OAuth
   - Your GitHub access token is encrypted and stored securely

2. **Browse Repositories**
   - View all your GitHub repositories
   - Search and filter repositories
   - Select a repository to import

3. **Explore Repository**
   - Browse repository file structure
   - View file contents directly in the browser
   - Supports both text files and images

4. **Generate System Design**
   - Click "Generate System Design" to analyze the repository
   - AI automatically analyzes:
     - Architecture patterns and structure
     - Dependencies and frameworks
     - Database schemas and ORMs
     - API endpoints and routes
     - Infrastructure and deployment configs
     - Testing frameworks
   - Receive a comprehensive Mermaid architecture diagram

5. **Update Designs**
   - Edit generated Mermaid diagrams
   - Save changes to the database
   - Reset to original if needed

### Task Generation

After generating a system design (either from natural language or GitHub import), you can get an AI-powered task breakdown:

1. **Access Task Breakdown**
   - Navigate to any generated design
   - Click on the "Tasks" or "View Tasks" button
   - AI automatically generates tasks if not already cached

2. **Task Organization**
   - Tasks are automatically categorized by area (Frontend, Backend, Database, DevOps, etc.)
   - Each task includes:
     - **Title**: Clear, actionable task name
     - **Description**: Detailed explanation of what needs to be done
     - **Priority**: High, medium, or low priority assignment
     - **Estimated Hours**: Time estimate for completion
     - **Dependencies**: Other tasks that must be completed first
3. **Project Overview**
   - View total task count
   - See total estimated hours
   - Track high-priority tasks
   - Monitor progress by category

4. **Caching**
   - Generated tasks are cached in the database
   - Instant retrieval on subsequent visits
   - Consistent task breakdown for team collaboration

### History

- View all previous generations
- Filter and search through your design history

### Metrics

- Access metrics dashboard for generation statistics
- Monitor AI performance and user activity

## Security Features

### GitHub Token Protection

- **Encrypted Storage**: All GitHub access tokens are encrypted using AES-256-GCM before storage
- **Server-Side Operations**: GitHub API calls are proxied through backend endpoints
- **No Frontend Exposure**: Tokens never reach the frontend or client-side code
- **Secure Proxy Endpoints**:
  - `/api/github/status` - Check connection status
  - `/api/github/repos` - Fetch user repositories
  - `/api/github/repo-info` - Get repository information
  - `/api/github/repo-tree` - Fetch repository file tree
  - `/api/github/file-content` - Get file contents
  - `/api/analyze-repository` - Analyze repository structure

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm prisma:studio` - Open Prisma Studio for database management
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:push` - Push schema changes to database

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard (see Installation section)
4. **Important**: Make sure to add the `ENCRYPTION_KEY` environment variable
5. Deploy

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
