import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";
import { Badge } from "@/components/ui/badge";

interface DatabaseSchemaSectionProps {
  schema: ArchitectureData["databaseSchema"];
}

export default function DatabaseSchemaSection({
  schema,
}: DatabaseSchemaSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Type:</span>
        <Badge
          variant="secondary"
          className="bg-foreground text-background font-bold border-none px-3 rounded-md uppercase tracking-wider text-[10px]"
        >
          {schema.type}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {schema.collections.map((collection, index) => (
          <Card key={index} className="border-border/60 shadow-none bg-card/30">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-bold tracking-tight">
                {collection.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-0.5">
                {Object.entries(collection.fields).map(([field, type]) => (
                  <div
                    key={field}
                    className="flex justify-between items-center text-xs py-2 border-b border-border/10 last:border-0"
                  >
                    <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-foreground font-mono">
                      {field}
                    </code>
                    <span className="text-muted-foreground font-medium">
                      {type}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
