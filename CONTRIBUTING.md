# Contributing to ArcMind AI

First off, thank you for considering contributing to ArcMind AI! It's people like you that make ArcMind AI such a great tool. We welcome contributions from everyone, whether it's a bug report, feature suggestion, documentation improvement, or code contribution.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
  - [Documentation Style Guide](#documentation-style-guide)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/arcmindAI.git
   cd arcmindAI
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/SATYAM-PRATIBHAN/arcmindAI.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, select the **🐛 Bug Report** template when opening a new issue on GitHub. 

For complete guidelines on issue reporting and template details, refer to [`docs/ISSUE_TEMPLATES.md`](docs/ISSUE_TEMPLATES.md).

Key guidelines:
- **Use a clear and descriptive title** starting with `[BUG]: `
- **Describe the exact steps to reproduce the problem**
- **Provide error logs and stack traces** using Markdown code blocks
- **Attach screenshots or screen recordings** for UI defects
- **Include your environment details** (OS, Node.js version, browser, etc.)

### Suggesting Features

Feature suggestions are welcome! Select the **✨ Feature Request** template when creating an issue.

Before submitting a feature request:
- **Check if the feature has already been suggested**
- **Provide a clear problem statement and use case**
- **Detail your proposed solution and architecture impact**
- **Include mockups or UI sketches** where applicable

For documentation, UI/UX, performance, security, and refactoring proposals, please select the corresponding issue template when opening a new issue. See [`docs/ISSUE_TEMPLATES.md`](docs/ISSUE_TEMPLATES.md) for full details.

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements

### Pull Requests

1. **Follow the style guidelines** outlined below
2. **Update documentation** if you're changing functionality
3. **Write meaningful commit messages**
4. **Test your changes** thoroughly
5. **Keep pull requests focused** - one feature/fix per PR
6. **Include pictures or videos for UI changes**. If your feature includes UI changes, pictures or videos **must** be attached. Otherwise, the PR will be taken down without any review.

**Pull Request Process:**

1. Ensure your code follows the project's style guidelines
2. Update the README.md or relevant documentation with details of changes
3. Add tests for new features or bug fixes
4. Ensure all tests pass: `pnpm test` (if applicable)
5. Run linting: `pnpm lint`
6. Format your code: `pnpm format`
7. Update your branch with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
8. Push to your fork and submit a pull request
9. Wait for review and address any feedback

**Pull Request Template:**

```markdown
## Description

Brief description of what this PR does.

## Related Issue

Fixes #(issue number)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## How Has This Been Tested?

Describe the tests you ran to verify your changes.

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

Add screenshots to help explain your changes.
```

## Development Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

   Fill in the required values (see README.md for details)

3. **Set up the database**:

   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

4. **Run the development server**:

   ```bash
   pnpm dev
   ```

5. **Open your browser** at [http://localhost:3000](http://localhost:3000)

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` - Improving structure/format of the code
  - ⚡️ `:zap:` - Improving performance
  - 🐛 `:bug:` - Fixing a bug
  - ✨ `:sparkles:` - Adding a new feature
  - 📝 `:memo:` - Writing docs
  - 🚀 `:rocket:` - Deploying stuff
  - 💄 `:lipstick:` - Updating UI and style files
  - ✅ `:white_check_mark:` - Adding tests
  - 🔒 `:lock:` - Fixing security issues
  - ♻️ `:recycle:` - Refactoring code
  - ⬆️ `:arrow_up:` - Upgrading dependencies
  - ⬇️ `:arrow_down:` - Downgrading dependencies

**Example:**

```
✨ Add GitHub repository import feature

- Implement OAuth authentication with GitHub
- Add repository browsing and file exploration
- Encrypt and store GitHub access tokens securely
- Create proxy endpoints for GitHub API calls

Fixes #123
```

### TypeScript Style Guide

- Use **TypeScript** for all new code
- Follow the existing code style (enforced by ESLint)
- Use **meaningful variable and function names**
- Add **JSDoc comments** for complex functions
- Prefer **functional components** and hooks in React
- Use **async/await** over promises where possible
- Avoid **any** types - use proper typing
- Use **const** over **let** where possible
- Use **template literals** over string concatenation

**Example:**

```typescript
/**
 * Encrypts sensitive data using AES-256-GCM encryption
 * @param data - The data to encrypt
 * @param encryptionKey - The encryption key (32 bytes)
 * @returns Encrypted data with IV and auth tag
 */
export function encryptData(data: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "hex"),
    iv,
  );

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
```

### Documentation Style Guide

- Use **Markdown** for documentation
- Keep line length to **80-100 characters** for readability
- Use **code blocks** with language specification
- Include **examples** where applicable
- Use **clear headings** and structure
- Add **links** to related documentation

## Project Structure

```
arcmindAI/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (protected)/       # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...               # Feature components
├── lib/                   # Utility functions and configurations
│   ├── ai/               # AI-related utilities
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database utilities
│   └── utils/            # General utilities
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Testing

While we're working on comprehensive test coverage, please ensure:

1. **Manual testing** of your changes
2. **Test edge cases** and error scenarios
3. **Verify responsive design** on different screen sizes
4. **Check browser compatibility** (Chrome, Firefox, Safari, Edge)
5. **Run linting**: `pnpm lint`
6. **Format code**: `pnpm format`

## Community

- **Found a bug?** Open an [Issue](https://github.com/SATYAM-PRATIBHAN/arcmindAI/issues)

## Recognition

Contributors will be recognized in our README.md. Thank you for making ArcMind AI better! 🎉

## Questions?

Don't hesitate to ask questions! We're here to help. You can:

- Comment on an existing issue
- Reach out to the maintainers

**Happy Contributing! 🚀**
