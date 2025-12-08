"use client";

import { Button } from "@/components/ui/button";
import { Github, Code2, Zap, Shield, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOC_ROUTES } from "@/lib/routes";

export function GithubConnect() {
  return (
    <div className="min-h-screen w-full py-28 lg:py-32">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative bg-primary/10 p-6 rounded-2xl border border-primary/20">
              <Github className="w-16 h-16 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Import from GitHub
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Connect your GitHub account to automatically generate system
              architecture diagrams from your repositories
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() =>
              signIn("github", { callbackUrl: DOC_ROUTES.IMPORT.ROOT })
            }
            size="lg"
            className="text-lg px-8 py-6 cursor-pointer group"
          >
            <Github className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
            Connect GitHub Account
          </Button>

          <p className="text-sm text-muted-foreground">
            We only request read access to your repositories
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Repository Analysis</CardTitle>
              <CardDescription>
                Automatically analyze your codebase structure, dependencies, and
                architecture patterns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Diagrams</CardTitle>
              <CardDescription>
                Generate beautiful Mermaid diagrams with AI that understands
                your system architecture
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Instant Updates</CardTitle>
              <CardDescription>
                Edit and refine your diagrams with our interactive editor and AI
                suggestions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Security Note */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="bg-muted/50 border-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Your data is secure</h3>
                  <p className="text-sm text-muted-foreground">
                    We only request read-only access to your repositories. We
                    never modify your code or access private information beyond
                    what&apos;s necessary for diagram generation. Your GitHub
                    token is securely stored and encrypted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold text-lg">Connect GitHub</h3>
              <p className="text-sm text-muted-foreground">
                Authorize ArcMind to access your GitHub repositories
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold text-lg">Select Repository</h3>
              <p className="text-sm text-muted-foreground">
                Choose a repository and let AI analyze its structure
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold text-lg">Generate & Edit</h3>
              <p className="text-sm text-muted-foreground">
                Get your diagram instantly and refine it with AI assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
