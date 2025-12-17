# Koenig Solutions AI Chatbot

Enterprise-scale AI chatbot for Koenig Solutions website with admin dashboard, knowledge base integration, and lead capture.

## Features

- **AI-Powered Chat Widget** - Floating chatbot powered by Claude/GPT with RAG-based knowledge retrieval
- **Admin Dashboard** - Monitor live conversations, view analytics, manage knowledge base
- **Lead Capture** - Collect visitor information and sync to CRM
- **Answer Training** - Rate AI responses to improve accuracy over time
- **Human Handoff** - Transfer conversations to human agents when needed
- **Real-time Updates** - Live conversation monitoring via Supabase Realtime

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Claude API (primary) + OpenAI (embeddings/fallback)
- **Auth**: WorkOS SSO
- **Deployment**: Vercel

## Project Structure

```
koenig-chatbot/
├── src/
│   ├── app/
│   │   ├── (dashboard)/      # Admin dashboard pages
│   │   │   ├── live/         # Live conversation monitor
│   │   │   ├── conversations/# Chat logs
│   │   │   ├── training/     # Answer rating/training
│   │   │   ├── knowledge-base/# KB management
│   │   │   ├── analytics/    # Analytics dashboard
│   │   │   ├── leads/        # Lead management
│   │   │   └── settings/     # Configuration
│   │   ├── api/              # API routes
│   │   ├── demo/             # Widget demo page
│   │   └── widget/           # Embeddable widget page
│   ├── components/
│   │   ├── chat/             # Chat widget components
│   │   ├── dashboard/        # Dashboard components
│   │   └── ui/               # Reusable UI components
│   ├── lib/
│   │   ├── ai/               # AI orchestration (Claude, OpenAI)
│   │   ├── knowledge/        # RAG pipeline
│   │   └── supabase/         # Database clients
│   └── types/                # TypeScript definitions
├── public/
│   └── widget/
│       └── loader.js         # Embeddable widget script
├── scripts/
│   └── sync-courses.ts       # Course data sync script
└── supabase/
    └── migrations/           # Database schema
```

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Vardaan97/Koenigchat.git
cd Koenigchat
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable the pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the migration in `supabase/migrations/001_initial_schema.sql`
4. Copy your project URL and keys

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional
WORKOS_API_KEY=your-workos-key
CRM_WEBHOOK_URL=your-crm-webhook
```

### 4. Run Development Server

```bash
npm run dev
```

- **Dashboard**: http://localhost:3000
- **Widget Demo**: http://localhost:3000/demo
- **Widget (iframe)**: http://localhost:3000/widget

## Embedding the Widget

Add this script to any webpage:

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://chat.learnova.training/widget/loader.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

Or with custom configuration:

```html
<script>
  window.KoenigChatConfig = {
    position: 'bottom-right',
    primaryColor: '#0066cc',
    greeting: 'Hi! How can I help you today?'
  };
</script>
<script src="https://chat.learnova.training/widget/loader.js" async></script>
```

## Syncing Course Data

Import course data from CSV:

```bash
npx ts-node scripts/sync-courses.ts path/to/courses.csv
```

CSV format:
```csv
URL,Course Name,Code,Vendor,Certification,Duration,Category
https://...,Azure Administrator,AZ-104,Microsoft,Yes,5 days,Cloud
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/message` | POST | Send chat message |
| `/api/chat/handoff` | POST | Request human takeover |
| `/api/chat/feedback` | POST | Rate message |
| `/api/leads` | GET/POST | Manage leads |
| `/api/leads/sync-crm` | POST | Sync lead to CRM |
| `/api/conversations` | GET | List conversations |
| `/api/conversations/[id]` | GET | Get conversation detail |
| `/api/analytics` | GET | Dashboard analytics |
| `/api/knowledge/courses` | GET | Search courses |

## Dashboard Sections

- **Live** - Real-time conversation monitoring
- **Conversations** - Searchable chat logs with filters
- **Training** - Rate AI responses, flag incorrect answers
- **Knowledge Base** - Manage courses, articles, FAQs
- **Analytics** - Charts, metrics, engagement stats
- **Leads** - View/export captured leads
- **Settings** - Widget config, team management, integrations

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Custom Domain

Point `chat.learnova.training` to your Vercel deployment.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `OPENAI_API_KEY` | Yes | OpenAI API key (embeddings) |
| `WORKOS_API_KEY` | No | WorkOS API key (SSO) |
| `WORKOS_CLIENT_ID` | No | WorkOS client ID |
| `NEXTAUTH_SECRET` | No | NextAuth secret |
| `CRM_WEBHOOK_URL` | No | CRM webhook endpoint |
| `CRM_WEBHOOK_SECRET` | No | Webhook signing secret |

## License

Proprietary - Koenig Solutions
