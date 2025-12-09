import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface EntitiesSectionProps {
  entities: ArchitectureData["entities"];
}

export default function EntitiesSection({ entities }: EntitiesSectionProps) {
  return (
    <div className="space-y-4">
      {entities.map((entity, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{entity.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-sm">Fields:</h4>
                <ul className="text-sm text-gray-600 ml-4 list-disc">
                  {Object.entries(entity.fields).map(([field, type]) => (
                    <li key={field}>
                      <code className="font-mono">{field}</code>: {type}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Relations:</h4>
                <ul className="text-sm text-gray-600 ml-4 list-disc">
                  {Object.entries(entity.relations).map(([relation, desc]) => (
                    <li key={relation}>{desc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
