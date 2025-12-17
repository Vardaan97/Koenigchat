// =====================================================
// KOENIG CHATBOT - TYPE DEFINITIONS
// =====================================================

// User & Authentication Types
export type UserRole = 'viewer' | 'operator' | 'trainer' | 'admin' | 'super_admin';

export interface User {
  id: string;
  sso_id?: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  max_concurrent_chats: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permissions {
  live_monitor?: { view?: boolean; takeover?: boolean };
  chat_logs?: { view?: boolean; export?: boolean };
  training?: { rate?: boolean; suggest?: boolean; approve?: boolean };
  knowledge_base?: { view?: boolean; edit?: boolean };
  analytics?: { view?: boolean };
  settings?: { view?: boolean; edit?: boolean };
  '*'?: boolean;
}

// Visitor & Lead Types
export interface Visitor {
  id: string;
  fingerprint?: string;
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  first_seen_at: string;
  last_seen_at: string;
  total_conversations: number;
  total_messages: number;
  preferred_language: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 'new' | 'qualified' | 'unqualified' | 'contacted' | 'converted';

export interface Lead {
  id: string;
  visitor_id?: string;
  conversation_id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interested_courses: CourseInterest[];
  interested_learning_paths: LPInterest[];
  budget_range?: string;
  timeline?: string;
  lead_score: number;
  status: LeadStatus;
  crm_synced: boolean;
  crm_id?: string;
  crm_sync_error?: string;
  crm_synced_at?: string;
  assigned_sales_rep_id?: string;
  notes?: string;
  source_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseInterest {
  id: string;
  title: string;
  slug?: string;
}

export interface LPInterest {
  id: string;
  title: string;
  slug?: string;
}

// Conversation & Message Types
export type ConversationStatus = 'active' | 'closed' | 'escalated' | 'waiting';
export type MessageRole = 'visitor' | 'assistant' | 'operator' | 'system';

export interface Conversation {
  id: string;
  visitor_id: string;
  visitor?: Visitor;
  started_at: string;
  ended_at?: string;
  status: ConversationStatus;
  source_url?: string;
  source_page_title?: string;
  device_type?: string;
  browser?: string;
  ip_country?: string;
  ip_city?: string;
  assigned_operator_id?: string;
  assigned_operator?: User;
  is_bot_handling: boolean;
  escalated_at?: string;
  escalation_reason?: string;
  lead_captured: boolean;
  lead_id?: string;
  lead?: Lead;
  message_count: number;
  avg_response_time_ms?: number;
  satisfaction_rating?: number;
  last_message_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  content_type: string;
  model_used?: string;
  tokens_input?: number;
  tokens_output?: number;
  response_time_ms?: number;
  sources_used: KnowledgeSource[];
  operator_id?: string;
  operator?: User;
  rating?: number;
  flagged: boolean;
  flag_reason?: string;
  suggested_response?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface KnowledgeSource {
  type: 'course' | 'learning_path' | 'article' | 'document';
  id: string;
  title: string;
  url?: string;
  similarity?: number;
}

// Knowledge Base Types
export interface Course {
  id: string;
  source_id?: string;
  title: string;
  slug?: string;
  course_code?: string;
  description?: string;
  short_description?: string;
  vendor?: string;
  certification?: string;
  category?: string;
  subcategory?: string;
  skill_level?: string;
  duration_hours?: number;
  duration_days?: number;
  prerequisites?: string;
  target_audience?: string;
  objectives: string[];
  key_features: string[];
  topics_covered: string[];
  usps: string[];
  delivery_modes: string[];
  base_price?: number;
  currency: string;
  price_info?: string;
  next_batch_date?: string;
  page_url?: string;
  page_title?: string;
  meta_description?: string;
  primary_cta?: string;
  secondary_cta?: string;
  credibility_markers: string[];
  last_synced_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: string;
  source_id?: string;
  title: string;
  slug?: string;
  description?: string;
  courses: string[];
  total_duration_hours?: number;
  target_role?: string;
  certification_track?: string;
  page_url?: string;
  last_synced_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  content_type: 'faq' | 'article' | 'guide';
  category?: string;
  tags: string[];
  is_public: boolean;
  source_type: string;
  source_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  document_title?: string;
  document_type?: string;
  chunk_index: number;
  content: string;
  page_number?: number;
  section_title?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// AI & Training Types
export interface TrainingExample {
  id: string;
  message_id?: string;
  user_input: string;
  original_response: string;
  improved_response?: string;
  topic?: string;
  intent?: string;
  quality_rating?: number;
  is_approved: boolean;
  feedback_notes?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AIPrompt {
  id: string;
  name: string;
  version: number;
  content: string;
  is_active: boolean;
  usage_count: number;
  avg_rating?: number;
  created_by?: string;
  created_at: string;
}

// Widget Types
export interface WidgetConfig {
  id: string;
  domain: string;
  api_key: string;
  is_active: boolean;
  config: WidgetSettings;
  allowed_origins: string[];
  created_at: string;
  updated_at: string;
}

export interface WidgetSettings {
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  greeting: string;
  placeholder: string;
  showAvatar: boolean;
  collectEmail: boolean;
  companyName: string;
  agentName: string;
  offlineMessage?: string;
}

// Analytics Types
export interface DailyAnalytics {
  date: string;
  total_conversations: number;
  total_messages: number;
  unique_visitors: number;
  avg_response_time_ms?: number;
  avg_conversation_duration_seconds?: number;
  leads_captured: number;
  escalations: number;
  avg_satisfaction_rating?: number;
  flagged_responses: number;
  total_tokens_used: number;
  ai_cost_usd: number;
  top_topics: TopicCount[];
  top_courses_asked: CourseCount[];
  created_at: string;
}

export interface TopicCount {
  topic: string;
  count: number;
}

export interface CourseCount {
  course_id: string;
  course_title: string;
  count: number;
}

// API Types
export interface ChatRequest {
  conversation_id?: string;
  visitor_id?: string;
  message: string;
  page_context?: PageContext;
}

export interface PageContext {
  url: string;
  title?: string;
  type?: string;
  course_id?: string;
  course_name?: string;
}

export interface ChatResponse {
  conversation_id: string;
  message: Message;
  suggested_actions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'link' | 'quick_reply' | 'form';
  label: string;
  value: string;
  url?: string;
}

// WebSocket Event Types
export interface WSMessage {
  type: 'message' | 'typing' | 'status' | 'takeover' | 'error';
  payload: unknown;
}

export interface TypingPayload {
  conversation_id: string;
  is_typing: boolean;
  user_type: 'visitor' | 'operator' | 'assistant';
}

// Search Types
export interface SearchResult {
  source_type: 'course' | 'learning_path' | 'article' | 'document';
  source_id: string;
  title: string;
  content: string;
  url?: string;
  similarity: number;
}

// CRM Webhook Types
export interface CRMWebhookPayload {
  event: 'lead.created' | 'lead.updated';
  lead: Lead;
  conversation_summary?: string;
  timestamp: string;
}
