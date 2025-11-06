# ArcMind AI - AI-Powered System Design Generator

Generate structured system designs using AI. Describe your requirements and get detailed architecture diagrams, components, and tech stacks powered by Gemini and LangChain.

## Features

- **AI-Powered Generation**: Leverage Google Gemini and LangChain to create comprehensive system designs from natural language descriptions
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
- **Authentication**: NextAuth.js
- **AI**: Google Gemini AI, LangChain
- **UI Components**: Radix UI, Shadcn/ui
- **Email**: Nodemailer
- **Rate Limiting**: Upstash Redis
- **Monitoring**: Prometheus Client
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- MongoDB database
- Google AI API key
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
- `DATABASE_URL`: MongoDB connection string (example: `mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname`)
- `NEXTAUTH_SECRET`: A random string used for NextAuth session encryption
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID (for login)
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret
- `GOOGLE_REFRESH_TOKEN`: For server-side Google API access
- `GOOGLE_REDIRECT_URI`: Redirect URI registered with Google
- `GEMINI_API_KEY`: Google Gemini AI API Key
- `JWT_SECRET`: Secret key for JWT token signing
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST API URL (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token
- `ADMIN_EMAIL`: Email of the admin (notifications, etc.)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image uploads
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
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

### History
- View all previous generations
- Filter and search through your design history

### Metrics
- Access metrics dashboard for generation statistics
- Monitor AI performance and user activity

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
