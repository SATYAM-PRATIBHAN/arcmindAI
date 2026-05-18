import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface EntitiesSectionProps {
  entities: ArchitectureData["entities"];
}

export default function EntitiesSection({ entities }: EntitiesSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {entities.map((entity, index) => (
        <Card key={index} className="border-border/60 shadow-none bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold tracking-tight">
              {entity.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Fields
              </h4>
              <div className="bg-accent/30 rounded-lg p-3 border border-border/40">
                <ul className="space-y-2">
                  {Object.entries(entity.fields).map(([field, type]) => (
                    <li
                      key={field}
                      className="flex items-center justify-between text-xs"
                    >
                      <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-foreground font-mono">
                        {field}
                      </code>
                      <span className="text-muted-foreground">{type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Relations
              </h4>
              <ul className="space-y-2 pl-1">
                {Object.entries(entity.relations).map(([relation, desc]) => (
                  <li
                    key={relation}
                    className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-border shrink-0" />
                    {desc}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
