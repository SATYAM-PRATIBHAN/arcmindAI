import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";

// Enable default metrics (CPU, memory, etc.)
collectDefaultMetrics();

// AI Generation Metrics
export const aiGenerationRequestsTotal = new Counter({
  name: "ai_generation_requests_total",
  help: "Number of generation requests made to the AI (Gemini)",
});

export const aiGenerationSuccessTotal = new Counter({
  name: "ai_generation_success_total",
  help: "Number of successful generations returned without validation error",
});

export const aiGenerationFailureTotal = new Counter({
  name: "ai_generation_failure_total",
  help: "Number of failed AI generations (timeout, invalid JSON, etc.)",
});

export const aiGenerationDurationSeconds = new Histogram({
  name: "ai_generation_duration_seconds",
  help: "Time taken per generation from prompt to final JSON response",
  buckets: [1, 5, 10, 30, 60, 120], // Buckets in seconds
});

export const aiGenerationOutputSizeBytes = new Gauge({
  name: "ai_generation_output_size_bytes",
  help: "Size of the generated JSON + Mermaid response in bytes",
});

// User Metrics
export const activeUsersTotal = new Gauge({
  name: "active_users_total",
  help: "Number of currently active sessions",
});

export const userSignupsTotal = new Counter({
  name: "user_signups_total",
  help: "Total new users registered",
});

export const userLoginsTotal = new Counter({
  name: "user_logins_total",
  help: "Number of successful logins",
});

export const userGenerationsTotal = new Counter({
  name: "user_generations_total",
  help: "Number of architecture generations per user",
  labelNames: ["user_id"],
});

export const userLastActivityTimestamp = new Gauge({
  name: "user_last_activity_timestamp",
  help: "Last activity time",
  labelNames: ["user_id"],
});

// API & System Metrics
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Count of all API requests",
  labelNames: ["route", "method", "status_code"],
});

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "Response latency per API route",
  labelNames: ["route"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const apiGatewayErrorsTotal = new Counter({
  name: "api_gateway_errors_total",
  help: "Number of 4xx/5xx errors returned",
  labelNames: ["status_code"],
});

export const databaseQueryDurationSeconds = new Histogram({
  name: "database_query_duration_seconds",
  help: "Time taken for Prisma queries",
  labelNames: ["operation"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

export const cacheHitsTotal = new Counter({
  name: "cache_hits_total",
  help: "Cache hits (when Redis/memory is used)",
});

// Infrastructure Metrics
export const processCpuUsagePercent = new Gauge({
  name: "process_cpu_usage_percent",
  help: "CPU usage of the Next.js server",
});

export const processMemoryUsageBytes = new Gauge({
  name: "process_memory_usage_bytes",
  help: "Memory usage of the process",
});

export const systemLoadAverage = new Gauge({
  name: "system_load_average",
  help: "Node.js load average",
});

export const diskSpaceUsageBytes = new Gauge({
  name: "disk_space_usage_bytes",
  help: "Disk usage",
});

// Business Metrics
export const avgGenerationsPerUser = new Gauge({
  name: "avg_generations_per_user",
  help: "Average number of generations per user",
});

export const failedMermaidRendersTotal = new Counter({
  name: "failed_mermaid_renders_total",
  help: "Number of invalid Mermaid diagrams detected",
});

export const validatedJsonSuccessRate = new Gauge({
  name: "validated_json_success_rate",
  help: "Percentage of AI responses passing JSON validation",
});

export const retainedUsers7dTotal = new Gauge({
  name: "retained_users_7d_total",
  help: "Users active in last 7 days",
});

// Export register for scraping
export { register };
