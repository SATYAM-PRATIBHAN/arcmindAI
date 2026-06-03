import { ArchitectureData } from "../utils/types";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "./SectionCard";

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
        <SectionCard
          key={index}
          title={service.name}
          className="hover:border-border/100 transition-colors duration-300"
        >
          <div className="space-y-4">
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
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
