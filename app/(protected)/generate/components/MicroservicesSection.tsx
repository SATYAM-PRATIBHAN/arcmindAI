import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface MicroservicesSectionProps {
  microservices: ArchitectureData["Explanation"]["microservices"];
}

export default function MicroservicesSection({ microservices }: MicroservicesSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {microservices.map((service, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{service.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">
              {service.responsibility}
            </p>
            <div className="flex flex-wrap gap-2">
              {service.techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
