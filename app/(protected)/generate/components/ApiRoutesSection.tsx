import { Card, CardContent } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";
import { Badge } from "@/components/ui/badge";

interface ApiRoutesSectionProps {
  apiRoutes: ArchitectureData["apiRoutes"];
}

export default function ApiRoutesSection({ apiRoutes }: ApiRoutesSectionProps) {
  return (
    <div className="space-y-12">
      {apiRoutes.map((serviceRoutes, index) => (
        <div key={index} className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold tracking-tight">
              {serviceRoutes.service}
            </h3>
            <div className="h-px flex-1 bg-border/40"></div>
          </div>

          <div className="grid gap-4">
            {serviceRoutes.routes.map((route, idx) => (
              <Card
                key={idx}
                className="border-border/60 shadow-none bg-card/30 overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className="bg-foreground text-background font-bold border-none px-2 rounded-md"
                      >
                        {route.method}
                      </Badge>
                      <code className="text-[13px] font-mono bg-accent/50 px-2 py-0.5 rounded border border-border/40 text-foreground">
                        {route.path}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 italic">
                      {route.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <details className="bg-accent/20 border border-border/40 rounded-xl overflow-hidden transition-all duration-300">
                        <summary className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer hover:bg-accent/40 list-none flex items-center justify-between">
                          Request Payload
                          <span className="text-[14px] opacity-40 group-open:rotate-180 transition-transform">
                            ↓
                          </span>
                        </summary>
                        <div className="p-4 pt-0">
                          <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto custom-scrollbar leading-relaxed">
                            {JSON.stringify(route.request, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                    <div className="group">
                      <details className="bg-accent/20 border border-border/40 rounded-xl overflow-hidden transition-all duration-300">
                        <summary className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer hover:bg-accent/40 list-none flex items-center justify-between">
                          Expected Response
                          <span className="text-[14px] opacity-40 group-open:rotate-180 transition-transform">
                            ↓
                          </span>
                        </summary>
                        <div className="p-4 pt-0">
                          <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto custom-scrollbar leading-relaxed">
                            {JSON.stringify(route.response, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
