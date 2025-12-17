-- =====================================================
-- KOENIG CHATBOT DATABASE SCHEMA
-- Version: 1.0.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('viewer', 'operator', 'trainer', 'admin', 'super_admin');
CREATE TYPE conversation_status AS ENUM ('active', 'closed', 'escalated', 'waiting');
CREATE TYPE message_role AS ENUM ('visitor', 'assistant', 'operator', 'system');
CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'unqualified', 'contacted', 'converted');

-- =====================================================
-- USERS & ACCESS CONTROL
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sso_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    max_concurrent_chats INT DEFAULT 5,
    is_available BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role user_role PRIMARY KEY,
    permissions JSONB NOT NULL
);

INSERT INTO role_permissions (role, permissions) VALUES
('viewer', '{"live_monitor": {"view": true}, "chat_logs": {"view": true}}'),
('operator', '{"live_monitor": {"view": true, "takeover": true}, "chat_logs": {"view": true}}'),
('trainer', '{"live_monitor": {"view": true}, "chat_logs": {"view": true, "export": true}, "training": {"rate": true, "suggest": true}}'),
('admin', '{"live_monitor": {"view": true, "takeover": true}, "chat_logs": {"view": true, "export": true}, "training": {"rate": true, "suggest": true, "approve": true}, "knowledge_base": {"view": true, "edit": true}, "analytics": {"view": true}, "settings": {"view": true}}'),
('super_admin', '{"*": true}');

-- =====================================================
-- VISITORS & LEADS
-- =====================================================

CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint TEXT UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    preferred_language VARCHAR(10) DEFAULT 'en',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES visitors(id),
    conversation_id UUID,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    interested_courses JSONB DEFAULT '[]',
    interested_learning_paths JSONB DEFAULT '[]',
    budget_range VARCHAR(50),
    timeline VARCHAR(50),
    lead_score INT DEFAULT 0,
    status lead_status DEFAULT 'new',
    crm_synced BOOLEAN DEFAULT false,
    crm_id VARCHAR(100),
    crm_sync_error TEXT,
    crm_synced_at TIMESTAMPTZ,
    assigned_sales_rep_id UUID,
    notes TEXT,
    source_page TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_crm_synced ON leads(crm_synced) WHERE crm_synced = false;

-- =====================================================
-- CONVERSATIONS & MESSAGES
-- =====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID NOT NULL REFERENCES visitors(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status conversation_status DEFAULT 'active',
    source_url TEXT,
    source_page_title VARCHAR(500),
    device_type VARCHAR(20),
    browser TEXT,
    ip_country VARCHAR(2),
    ip_city VARCHAR(100),
    assigned_operator_id UUID REFERENCES users(id),
    is_bot_handling BOOLEAN DEFAULT true,
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,
    lead_captured BOOLEAN DEFAULT false,
    lead_id UUID REFERENCES leads(id),
    message_count INT DEFAULT 0,
    avg_response_time_ms INT,
    satisfaction_rating INT,
    last_message_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_visitor ON conversations(visitor_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_operator ON conversations(assigned_operator_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text',
    model_used VARCHAR(50),
    tokens_input INT,
    tokens_output INT,
    response_time_ms INT,
    sources_used JSONB DEFAULT '[]',
    operator_id UUID REFERENCES users(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    suggested_response TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_flagged ON messages(flagged) WHERE flagged = true;
CREATE INDEX idx_messages_unreviewed ON messages(rating) WHERE rating IS NULL AND role = 'assistant';

-- =====================================================
-- KNOWLEDGE BASE
-- =====================================================

CREATE TABLE kb_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(100) UNIQUE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(255),
    course_code VARCHAR(50),
    description TEXT,
    short_description VARCHAR(500),
    vendor VARCHAR(100),
    certification VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    skill_level VARCHAR(50),
    duration_hours INT,
    duration_days INT,
    prerequisites TEXT,
    target_audience TEXT,
    objectives JSONB DEFAULT '[]',
    key_features JSONB DEFAULT '[]',
    topics_covered JSONB DEFAULT '[]',
    usps JSONB DEFAULT '[]',
    delivery_modes JSONB DEFAULT '[]',
    base_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    price_info TEXT,
    next_batch_date DATE,
    page_url TEXT,
    page_title VARCHAR(500),
    meta_description TEXT,
    primary_cta VARCHAR(100),
    secondary_cta VARCHAR(100),
    credibility_markers JSONB DEFAULT '[]',
    embedding vector(1536),
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_courses_embedding ON kb_courses USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_kb_courses_vendor ON kb_courses(vendor);
CREATE INDEX idx_kb_courses_slug ON kb_courses(slug);

CREATE TABLE kb_learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(100) UNIQUE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    courses JSONB DEFAULT '[]',
    total_duration_hours INT,
    target_role VARCHAR(100),
    certification_track VARCHAR(255),
    page_url TEXT,
    embedding vector(1536),
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_lps_embedding ON kb_learning_paths USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE kb_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'faq',
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT true,
    embedding vector(1536),
    source_type VARCHAR(50) DEFAULT 'manual',
    source_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_articles_embedding ON kb_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_kb_articles_category ON kb_articles(category);

CREATE TABLE kb_document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,
    document_title VARCHAR(500),
    document_type VARCHAR(50),
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    page_number INT,
    section_title VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_chunks_embedding ON kb_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_kb_chunks_document ON kb_document_chunks(document_id);

-- =====================================================
-- AI TRAINING & FEEDBACK
-- =====================================================

CREATE TABLE ai_training_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id),
    user_input TEXT NOT NULL,
    original_response TEXT NOT NULL,
    improved_response TEXT,
    topic VARCHAR(100),
    intent VARCHAR(100),
    quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
    is_approved BOOLEAN DEFAULT false,
    feedback_notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    version INT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    usage_count INT DEFAULT 0,
    avg_rating DECIMAL(3,2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, version)
);

-- =====================================================
-- WIDGET CONFIGURATION
-- =====================================================

CREATE TABLE widget_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{
        "position": "bottom-right",
        "primaryColor": "#0066CC",
        "greeting": "Hi! How can I help you today?",
        "placeholder": "Type your message...",
        "showAvatar": true,
        "collectEmail": true,
        "offlineMessage": "We are currently offline. Please leave your email and we will get back to you."
    }',
    allowed_origins JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & LOGS
-- =====================================================

CREATE TABLE chat_analytics_daily (
    date DATE PRIMARY KEY,
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    avg_response_time_ms INT,
    avg_conversation_duration_seconds INT,
    leads_captured INT DEFAULT 0,
    escalations INT DEFAULT 0,
    avg_satisfaction_rating DECIMAL(3,2),
    flagged_responses INT DEFAULT 0,
    total_tokens_used INT DEFAULT 0,
    ai_cost_usd DECIMAL(10,4) DEFAULT 0,
    top_topics JSONB DEFAULT '[]',
    top_courses_asked JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update conversation stats on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- Update visitor stats
    UPDATE visitors
    SET
        total_messages = total_messages + 1,
        last_seen_at = NOW(),
        updated_at = NOW()
    WHERE id = (SELECT visitor_id FROM conversations WHERE id = NEW.conversation_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- Update visitor conversation count
CREATE OR REPLACE FUNCTION update_visitor_on_conversation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE visitors
    SET
        total_conversations = total_conversations + 1,
        last_seen_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.visitor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visitor_on_conversation
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_visitor_on_conversation();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_visitors_updated BEFORE UPDATE ON visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_kb_courses_updated BEFORE UPDATE ON kb_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_kb_lps_updated BEFORE UPDATE ON kb_learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_kb_articles_updated BEFORE UPDATE ON kb_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_widget_config_updated BEFORE UPDATE ON widget_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Semantic search function for courses
CREATE OR REPLACE FUNCTION search_courses(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    vendor VARCHAR(100),
    description TEXT,
    page_url TEXT,
    price_info TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb_courses.id,
        kb_courses.title,
        kb_courses.vendor,
        kb_courses.description,
        kb_courses.page_url,
        kb_courses.price_info,
        1 - (kb_courses.embedding <=> query_embedding) AS similarity
    FROM kb_courses
    WHERE kb_courses.is_active = true
      AND 1 - (kb_courses.embedding <=> query_embedding) > match_threshold
    ORDER BY kb_courses.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Search all knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    source_type TEXT,
    source_id UUID,
    title TEXT,
    content TEXT,
    url TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Search courses
    SELECT
        'course'::TEXT as source_type,
        c.id as source_id,
        c.title::TEXT,
        COALESCE(c.short_description, LEFT(c.description, 500))::TEXT as content,
        c.page_url::TEXT as url,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM kb_courses c
    WHERE c.is_active = true
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) > match_threshold

    UNION ALL

    -- Search learning paths
    SELECT
        'learning_path'::TEXT,
        lp.id,
        lp.title::TEXT,
        LEFT(lp.description, 500)::TEXT,
        lp.page_url::TEXT,
        1 - (lp.embedding <=> query_embedding)
    FROM kb_learning_paths lp
    WHERE lp.is_active = true
      AND lp.embedding IS NOT NULL
      AND 1 - (lp.embedding <=> query_embedding) > match_threshold

    UNION ALL

    -- Search articles
    SELECT
        'article'::TEXT,
        a.id,
        a.title::TEXT,
        LEFT(a.content, 500)::TEXT,
        a.source_url::TEXT,
        1 - (a.embedding <=> query_embedding)
    FROM kb_articles a
    WHERE a.embedding IS NOT NULL
      AND 1 - (a.embedding <=> query_embedding) > match_threshold

    UNION ALL

    -- Search document chunks
    SELECT
        'document'::TEXT,
        dc.id,
        dc.document_title::TEXT,
        LEFT(dc.content, 500)::TEXT,
        NULL::TEXT,
        1 - (dc.embedding <=> query_embedding)
    FROM kb_document_chunks dc
    WHERE dc.embedding IS NOT NULL
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold

    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Service role can access everything
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON conversations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON messages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON leads FOR ALL TO service_role USING (true);

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- SEED DEFAULT DATA
-- =====================================================

-- Insert default system prompts
INSERT INTO ai_prompts (name, version, content, is_active, created_at) VALUES
('system', 1, 'You are a helpful assistant for Koenig Solutions, a leading IT training company and Microsoft Partner of the Year 2025. You help website visitors find the right courses, answer questions about training programs, and guide them toward enrollment.

CRITICAL RULES:
1. Be CONCISE - maximum 3 sentences for simple questions
2. Use bullet points for lists (max 5 items)
3. Never repeat information the visitor already knows
4. One clear call-to-action per response
5. If linking to a page, just provide the link - don''t describe it
6. Be friendly but professional
7. Always try to understand the visitor''s goal and help them achieve it
8. Collect lead information naturally during conversation (name, email, phone, company)
9. When uncertain, ask clarifying questions rather than guessing

ABOUT KOENIG SOLUTIONS:
- Founded in 1993, 30+ years of IT training excellence
- Microsoft Training Services Partner of the Year 2025
- 729+ certification courses across Microsoft, AWS, Cisco, Oracle, Google Cloud
- Training modes: Live online, Classroom, 1-on-1, Self-paced (Flexi)
- Global presence with offices in India, USA, UK, UAE, Australia, Canada
- Guaranteed-to-Run (GTR) classes
- Happiness Guarantee policy', true, NOW()),
('greeting', 1, 'Hi! Welcome to Koenig Solutions. I''m here to help you find the right IT training course. What technology or certification are you interested in?', true, NOW()),
('lead_capture', 1, 'I''d love to help you further! Could you share your email so I can send you detailed course information and special offers?', true, NOW()),
('escalation', 1, 'I''ll connect you with one of our training advisors who can provide more personalized assistance. They''ll be with you shortly!', true, NOW());

-- Insert default widget config for testing
INSERT INTO widget_config (domain, api_key, config, allowed_origins) VALUES
('localhost', 'test_api_key_local_development_only', '{
    "position": "bottom-right",
    "primaryColor": "#0066CC",
    "greeting": "Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?",
    "placeholder": "Type your message...",
    "showAvatar": true,
    "collectEmail": true,
    "companyName": "Koenig Solutions",
    "agentName": "Koenig Assistant"
}', '["http://localhost:3000", "http://localhost:3001"]'),
('learnova.training', 'prod_api_key_replace_in_production', '{
    "position": "bottom-right",
    "primaryColor": "#0066CC",
    "greeting": "Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?",
    "placeholder": "Type your message...",
    "showAvatar": true,
    "collectEmail": true,
    "companyName": "Koenig Solutions",
    "agentName": "Koenig Assistant"
}', '["https://learnova.training", "https://chat.learnova.training", "https://www.koenig-solutions.com"]');
