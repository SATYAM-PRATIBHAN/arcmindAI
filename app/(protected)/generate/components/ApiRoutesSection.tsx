import { Card, CardContent } from "@/components/ui/card";
import { ArchitectureData } from "../utils/types";

interface ApiRoutesSectionProps {
  apiRoutes: ArchitectureData["apiRoutes"];
}

export default function ApiRoutesSection({ apiRoutes }: ApiRoutesSectionProps) {
  return (
    <div className="space-y-6">
      {apiRoutes.map((serviceRoutes, index) => (
        <div key={index}>
          <h3 className="text-xl font-semibold mb-4">
            {serviceRoutes.service}
          </h3>
          <div className="space-y-2">
            {serviceRoutes.routes.map((route, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        route.method === "GET"
                          ? "bg-green-100 text-green-800"
                          : route.method === "POST"
                            ? "bg-blue-100 text-blue-800"
                            : route.method === "PUT"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {route.method}
                    </span>
                    <code className="text-sm font-mono">{route.path}</code>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {route.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <details className="bg-gray-100 p-2 rounded">
                        <summary className="font-semibold cursor-pointer">
                          Request
                        </summary>
                        <pre className="mt-1 overflow-x-auto">
                          {JSON.stringify(route.request, null, 2)}
                        </pre>
                      </details>
                    </div>
                    <div>
                      <details className="bg-gray-100 p-2 rounded">
                        <summary className="font-semibold cursor-pointer">
                          Response
                        </summary>
                        <pre className="mt-1 overflow-x-auto">
                          {JSON.stringify(route.response, null, 2)}
                        </pre>
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
