export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type DatabaseField = {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  description?: string;
  constraints?: string;
};

export type DatabaseTable = {
  tableName: string;
  description?: string;
  fields: DatabaseField[];
  indices?: string[];
  foreignKeys?: {
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }[];
};

export type MarkdownExportInput = {
  title: string;
  description: string;
  overview: string;

  microservices?: {
    name: string;
    description?: string;
    languageAndFramework?: string[];
    responsibilities?: string[];
    workflow?: string;
    exposedEndpoints?: {
      method: HttpMethod;
      path: string;
      description?: string;
    }[];
    dependencies?: string[];
  }[];

  entities?: {
    name: string;
    type: "SQL Table" | "NoSQL Collection" | "In-Memory Store" | "External API";
    description?: string;
    fields?: {
      name: string;
      type: string;
      constraints?: string;
      description?: string;
    }[];
  }[];

  apiRoutes?: {
    serviceName: string;
    endPoints: {
      method: HttpMethod;
      path: string;
      description?: string;
      requestFormat?: string;
      responseFormat?: string;
    }[];
    description?: string;
  }[];

  databaseSchemas?: {
    name: string;
    type: "SQL" | "NoSQL" | "Graph" | "Time-Series";
    description?: string;
    tables?: DatabaseTable[];
  };

  infrastructure?: {
    category?: string;
    provider?: string;
    description?: string;
  }[];

  mermaidDiagrams?: {
    title: string;
    description?: string;
    code: string;
  }[];
};
