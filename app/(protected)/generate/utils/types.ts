export interface ArchitectureData {
  Explanation: {
    systemName: string;
    summary: string;
    microservices: Array<{
      name: string;
      responsibility: string;
      techStack: string[];
    }>;
    entities: Array<{
      name: string;
      fields: Record<string, string>;
      relations: Record<string, string>;
    }>;
    apiRoutes: Array<{
      service: string;
      routes: Array<{
        method: string;
        path: string;
        description: string;
        request: Record<string, string | object>;
        response: Record<string, string | object>;
      }>;
    }>;
    databaseSchema: {
      type: string;
      collections: Array<{ name: string; fields: Record<string, string> }>;
    };
    infrastructure: {
      hosting: string;
      database: string;
      auth: string;
      cdn: string;
      scaling: string;
    };
  };
  "Architecture Diagram": string;
}
