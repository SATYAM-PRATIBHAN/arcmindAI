import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface InfrastructureSectionProps {
  infra: ArchitectureData["infrastructure"];
}

export default function InfrastructureSection({
  infra,
}: InfrastructureSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(infra).map(([key, value]) => (
        <Card key={key} className="border-border/60 shadow-none bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {key.replace(/([A-Z])/g, " $1")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
