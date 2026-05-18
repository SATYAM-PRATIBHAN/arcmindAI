/**
 * Starter Prompt Templates
 *
 * Predefined templates to help new users get started with system architecture prompts.
 * These templates are fully editable and serve as starting points for generating architectures.
 */

export interface PromptTemplate {
  id: string;
  title: string;
  description?: string;
  body: string;
}

export const STARTER_TEMPLATES: PromptTemplate[] = [
  {
    id: "saas-billing",
    title: "SaaS Billing Platform",
    description: "A complete billing and subscription management system",
    body: `Build a scalable SaaS billing platform with:
- Subscription management (monthly, annual plans)
- Payment processing with Stripe/PayPal integration
- Invoice generation and email delivery
- Usage-based metering and overage charges
- Customer portal for billing history and payment methods
- Webhook handling for payment events
- Multi-currency support
- Dunning management for failed payments`,
  },
  {
    id: "realtime-chat",
    title: "Real-time Chat Application",
    description: "Scalable messaging system with WebSocket support",
    body: `Build a scalable real-time chat application with:
- User authentication and authorization
- WebSocket/Socket.io for real-time messaging
- Message persistence with database
- Typing indicators and read receipts
- Typing indicators and online status
- File and image sharing
- Group chat support with roles (admin, moderator, member)
- Message encryption for privacy
- Search and message filtering
- Push notifications`,
  },
  {
    id: "data-pipeline",
    title: "Data Pipeline & ETL System",
    description: "Extract, transform, and load data at scale",
    body: `Build a robust data pipeline and ETL system with:
- Data ingestion from multiple sources (APIs, databases, file uploads)
- Data transformation and validation pipeline
- Apache Kafka or message queue for event streaming
- Data quality checks and monitoring
- Error handling and retry logic with exponential backoff
- Scheduling with Airflow or similar orchestration
- Data warehouse storage (Snowflake, BigQuery, or similar)
- Real-time and batch processing modes
- Data versioning and lineage tracking
- Monitoring and alerting for pipeline failures`,
  },
  {
    id: "ai-assistant",
    title: "AI-Powered Assistant",
    description: "Intelligent assistant with LLM integration",
    body: `Build an AI-powered assistant platform with:
- LLM integration (OpenAI, Claude, Llama, or similar)
- Conversation memory and context management
- Prompt engineering and template system
- Vector database for semantic search (Pinecone, Weaviate)
- RAG (Retrieval Augmented Generation) capability
- Multi-modal support (text, image, audio)
- Rate limiting and usage tracking
- Fine-tuning capability for custom models
- Evaluation and feedback system
- Audit logging for compliance`,
  },
  {
    id: "ecommerce",
    title: "E-commerce Platform",
    description: "Full-featured online shopping system",
    body: `Build a comprehensive e-commerce platform with:
- Product catalog with search and filtering
- Shopping cart and checkout flow
- Payment gateway integration
- Order management and fulfillment tracking
- Inventory management with stock alerts
- User authentication and profile management
- Wishlists and product reviews
- Promotional codes and discount system
- Multi-vendor marketplace support
- Analytics and reporting dashboard`,
  },
  {
    id: "task-management",
    title: "Task Management App",
    description: "Collaborative task and project tracking",
    body: `Build a collaborative task management application with:
- Project organization and team workspaces
- Tasks with priorities, due dates, and assignees
- Kanban board or timeline views
- Real-time collaboration and comments
- File attachments and integrations
- Activity timeline and audit logs
- Notifications and reminders
- Custom fields and workflows
- Recurring tasks and dependencies
- Reporting and productivity analytics`,
  },
  {
    id: "social-network",
    title: "Social Network Platform",
    description: "User-generated content and social features",
    body: `Build a social network platform with:
- User profiles and social graphs
- Posts, feeds, and timeline
- Comments, likes, and reactions
- Direct messaging between users
- Friend/follower management
- Notification system for interactions
- Media uploads and sharing
- Privacy controls and content moderation
- Search functionality
- Recommendation algorithms for content`,
  },
  {
    id: "health-tracking",
    title: "Health & Fitness Tracker",
    description: "Personal health monitoring and analytics",
    body: `Build a health and fitness tracking application with:
- User profiles and health metrics tracking
- Workout logging and exercise database
- Nutrition tracking and meal planning
- Wearable device integration (Fitbit, Apple Watch)
- Health metrics visualization and trends
- Goal setting and progress tracking
- Social features for challenges and leaderboards
- Prescription and medication reminders
- Integration with healthcare providers
- Data privacy and HIPAA compliance`,
  },
];

/**
 * Get all available templates
 */
export function getTemplates(): PromptTemplate[] {
  return STARTER_TEMPLATES;
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return STARTER_TEMPLATES.find((template) => template.id === id);
}

/**
 * Search templates by title or description
 */
export function searchTemplates(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return STARTER_TEMPLATES.filter(
    (template) =>
      template.title.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.body.toLowerCase().includes(lowerQuery),
  );
}
