import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";
import { Badge } from "@/components/ui/badge";

interface MicroservicesSectionProps {
  microservices: ArchitectureData["microservices"];
}

export default function MicroservicesSection({
  microservices,
}: MicroservicesSectionProps) {
  const renderList = (title: string, items: string[]) => {
    if (!items.length) return null;
    return (
      <div className="mt-4 pt-4 border-t border-border/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          {title}
        </p>
        <ul className="grid grid-cols-1 gap-1.5 pl-1">
          {items.map((item, idx) => (
            <li
              key={`${title}-${idx}`}
              className="text-xs text-muted-foreground flex items-start gap-2"
            >
              <span className="mt-1.5 h-1 w-1 rounded-full bg-border shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {microservices.map((service, index) => (
        <Card
          key={index}
          className="border-border/60 hover:border-border/100 transition-colors duration-300 shadow-none bg-card/30"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold tracking-tight">
              {service.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {service.responsibility}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {service.techStack.map((tech, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-accent/50 text-[10px] font-medium border-border/50 py-0"
                >
                  {tech}
                </Badge>
              ))}
            </div>
            {service.details?.workflow && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Workflow
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  {service.details.workflow}
                </p>
              </div>
            )}
            <div className="space-y-0">
              {renderList("Inputs", service.details?.inputs ?? [])}
              {renderList("Outputs", service.details?.outputs ?? [])}
              {renderList(
                "Integration Points",
                service.details?.integrationPoints ?? [],
              )}
              {renderList("Data Storage", service.details?.dataStorage ?? [])}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
