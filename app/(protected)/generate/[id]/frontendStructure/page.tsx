"use client";

import { useParams, useRouter } from "next/navigation";
import { useFrontendStructure } from "@/hooks/useFrontendStructure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Layout,
  Code2,
  FileCode2,
  Settings2,
} from "lucide-react";
import { FileTreeRenderer } from "@/components/ui/file-tree";
import { Button } from "@/components/ui/button";

export default function FrontendStructurePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useFrontendStructure(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 animate-pulse">
        <div className="h-12 bg-muted rounded-2xl w-1/3 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6 flex justify-center pt-20">
        <Alert
          variant="destructive"
          className="max-w-2xl border-destructive/20 bg-destructive/5 rounded-2xl"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Failed to load frontend structure. {error || "Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { stack, structure, fileTree, recommendations } = data;

  const renderSectionHeader = (number: string, title: string) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
        {number}
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border/60"></div>
            <Sparkles className="w-4 h-4 text-muted-foreground/60" />
            <div className="h-px flex-1 bg-border/60"></div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-8 w-8 border-border/60 hover:border-border bg-card/50 transition-all duration-300"
                onClick={() => router.push(`/generate/${id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl flex items-center justify-center gap-3">
              <Layout className="h-10 w-10 text-primary" />
              Frontend Structure
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Detailed frontend architecture and project structure generated for
              your application.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-20 pt-12">
          <section className="space-y-6">
            {renderSectionHeader("01", "Tech Stack")}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-border/60 hover:border-border transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    <Code2 className="h-3.5 w-3.5" />
                    Core Framework
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Base Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm font-medium">Framework</span>
                    <Badge
                      variant="outline"
                      className="bg-accent/50 text-[10px] py-0"
                    >
                      {stack.framework}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm font-medium">Language</span>
                    <Badge
                      variant="outline"
                      className="bg-accent/50 text-[10px] py-0"
                    >
                      {stack.language}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">
                      State Management
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-accent/50 text-[10px] py-0"
                    >
                      {stack.stateManagement}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-border transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    <Layout className="h-3.5 w-3.5" />
                    UI & Styling
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Interface Layer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Styling
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stack.styling.map((style) => (
                        <Badge
                          key={style}
                          variant="outline"
                          className="bg-accent/50 text-[10px] py-0"
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      UI Library
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stack.uiLibrary.map((lib) => (
                        <Badge
                          key={lib}
                          variant="outline"
                          className="bg-accent/50 text-[10px] py-0"
                        >
                          {lib}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 hover:border-border transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    <Settings2 className="h-3.5 w-3.5" />
                    Infrastructure
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Tooling & Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Build Tools
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stack.buildTools.map((tool) => (
                        <Badge
                          key={tool}
                          variant="outline"
                          className="bg-accent/50 text-[10px] py-0"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Testing
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stack.testing.map((test) => (
                        <Badge
                          key={test}
                          variant="outline"
                          className="bg-accent/50 text-[10px] py-0"
                        >
                          {test}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6">
            {renderSectionHeader("02", "Page Architecture")}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {structure.pages.map((page, index) => (
                <Card
                  key={index}
                  className="border-border/60 hover:border-border transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm flex flex-col"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {page.path}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {page.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {page.description}
                    </p>
                    <div className="pt-4 border-t border-border/40 space-y-3">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Key Components
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {page.components.map((comp) => (
                            <Badge
                              key={comp}
                              variant="secondary"
                              className="bg-background/50 text-[10px] py-0 border-border/30"
                            >
                              {comp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          API Integrations
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {page.apiIntegrations.map((api) => (
                            <Badge
                              key={api}
                              variant="outline"
                              className="bg-primary/5 text-[10px] py-0 border-primary/20 text-primary"
                            >
                              {api}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            {renderSectionHeader("03", "Core Components")}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {structure.components.map((comp, index) => (
                <Card
                  key={index}
                  className="border-border/60 hover:border-border transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant="outline"
                        className="bg-accent/50 text-[10px] py-0"
                      >
                        {comp.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {comp.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {comp.description}
                    </p>
                    {comp.props && Object.keys(comp.props).length > 0 && (
                      <div className="pt-4 border-t border-border/40">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Primary Props
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(comp.props).map((prop) => (
                            <Badge
                              key={prop}
                              variant="secondary"
                              className="bg-background/50 text-[10px] py-0 border-border/30"
                            >
                              {prop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            {renderSectionHeader("04", "Shared Resources")}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Hooks", items: structure.hooks, icon: FileCode2 },
                {
                  title: "Services",
                  items: structure.services,
                  icon: Settings2,
                },
                { title: "Types", items: structure.types, icon: Code2 },
                { title: "Utils", items: structure.utils, icon: FileCode2 },
              ].map((section, idx) => (
                <Card
                  key={idx}
                  className="border-border/60 hover:border-border transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      <section.icon className="h-3.5 w-3.5" />
                      {section.title}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            {renderSectionHeader("05", "File Tree Architecture")}
            <div className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner">
              <FileTreeRenderer tree={fileTree} />
            </div>
          </section>

          <section className="space-y-6">
            {renderSectionHeader("06", "Strategic Recommendations")}
            <Card className="border-border/60 shadow-none bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0 md:even:border-b md:[&:nth-last-child(-n+2)]:border-0"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {rec}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
