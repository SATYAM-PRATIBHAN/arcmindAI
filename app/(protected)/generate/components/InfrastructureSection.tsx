import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface InfrastructureSectionProps {
  infra: ArchitectureData["Explanation"]["infrastructure"];
}

export default function InfrastructureSection({ infra }: InfrastructureSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(infra).map(([key, value]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
