import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface DatabaseSchemaSectionProps {
  schema: ArchitectureData["Explanation"]["databaseSchema"];
}

export default function DatabaseSchemaSection({ schema }: DatabaseSchemaSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold">Database Type:</h3>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded">
          {schema.type}
        </span>
      </div>
      <div className="space-y-4">
        {schema.collections.map((collection, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{collection.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(collection.fields).map(([field, type]) => (
                  <div
                    key={field}
                    className="flex justify-between text-sm border-b border-gray-100 py-1"
                  >
                    <code className="font-mono">{field}</code>
                    <span className="text-gray-600">{type}</span>
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
