"use client";

import { useParams } from "next/navigation";
import { useFrontendStructure } from "@/hooks/useFrontendStructure";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { FileTreeRenderer } from "@/components/ui/file-tree";

export default function FrontendStructurePage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useFrontendStructure(id);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load frontend structure. {error || "Please try again."}
        </AlertDescription>
      </Alert>
    );
  }

  const { stack, structure, fileTree, recommendations } = data;

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Frontend Architecture</CardTitle>
          <CardDescription>
            Generated structure for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stack Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Tech Stack</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Framework:</span>
                <Badge variant="secondary">{stack.framework}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Language:</span>
                <Badge variant="secondary">{stack.language}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Styling:</span>
                {stack.styling.map((style) => (
                  <Badge key={style} variant="secondary">
                    {style}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">UI Library:</span>
                {stack.uiLibrary.map((lib) => (
                  <Badge key={lib} variant="secondary">
                    {lib}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">State Management:</span>
                <Badge variant="secondary">{stack.stateManagement}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Form Handling:</span>
                <Badge variant="secondary">{stack.formHandling}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Data Fetching:</span>
                <Badge variant="secondary">{stack.dataFetching}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Authentication:</span>
                <Badge variant="secondary">{stack.authentication}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Testing:</span>
                {stack.testing.map((test) => (
                  <Badge key={test} variant="secondary">
                    {test}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Build Tools:</span>
                {stack.buildTools.map((tool) => (
                  <Badge key={tool} variant="secondary">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Structure Section */}
          <Accordion
            type="single"
            defaultValue="structure"
            collapsible
            className="w-full"
          >
            <AccordionItem value="structure">
              <AccordionTrigger className="text-2xl font-bold">
                Project Structure
              </AccordionTrigger>
              <AccordionContent className="space-y-6">
                {/* Pages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {structure.pages.map((page, index) => (
                        <div key={index} className="border p-4 rounded-lg">
                          <h3 className="font-semibold">
                            {page.name} - {page.path}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {page.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="font-medium text-xs">
                              Components:
                            </span>
                            {page.components.map((comp) => (
                              <Badge
                                key={comp}
                                variant="outline"
                                className="text-xs"
                              >
                                {comp}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="font-medium text-xs">
                              API Integrations:
                            </span>
                            {page.apiIntegrations.map((api) => (
                              <Badge
                                key={api}
                                variant="secondary"
                                className="text-xs"
                              >
                                {api}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Components */}
                <Card>
                  <CardHeader>
                    <CardTitle>Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {structure.components.map((comp, index) => (
                        <div key={index} className="border p-4 rounded-lg">
                          <h3 className="font-semibold">
                            {comp.name} ({comp.type})
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {comp.description}
                          </p>
                          {comp.props && (
                            <div className="mt-2">
                              <span className="font-medium text-xs">
                                Props:
                              </span>
                              <pre className="text-xs mt-1 p-2 bg-muted rounded">
                                {JSON.stringify(comp.props, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hooks, Services, Types, Utils */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hooks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {structure.hooks.map((hook, index) => (
                          <li key={index} className="text-sm">
                            {hook}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {structure.services.map((service, index) => (
                          <li key={index} className="text-sm">
                            {service}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {structure.types.map((type, index) => (
                          <li key={index} className="text-sm">
                            {type}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Utils</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {structure.utils.map((util, index) => (
                          <li key={index} className="text-sm">
                            {util}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator className="my-6" />

          {/* File Tree */}
          <Card>
            <CardHeader>
              <CardTitle>File Tree</CardTitle>
              <CardDescription>A cleaner visual representation</CardDescription>
            </CardHeader>
            <CardContent>
              <FileTreeRenderer tree={fileTree} />
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
