import * as claude from './claude';
import * as openai from './openai';
import { SYSTEM_PROMPT, INTENT_CLASSIFICATION_PROMPT } from './prompts/system';
import { searchKnowledgeBase } from '../knowledge/rag-pipeline';
import type { Message, SearchResult, PageContext } from '@/types';

export interface OrchestratorResponse {
  content: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  sources: SearchResult[];
  intent?: string;
  lead_ready?: boolean;
  response_time_ms: number;
}

interface ConversationContext {
  messages: Message[];
  visitor_name?: string;
  visitor_email?: string;
  page_context?: PageContext;
  collected_info: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    interested_courses: string[];
  };
}

export async function generateChatResponse(
  userMessage: string,
  context: ConversationContext
): Promise<OrchestratorResponse> {
  const startTime = Date.now();

  // Step 1: Classify intent (fast, parallel with search)
  const intentPromise = claude.classifyIntent(userMessage, INTENT_CLASSIFICATION_PROMPT);

  // Step 2: Search knowledge base for relevant context
  const searchPromise = searchKnowledgeBase(userMessage, {
    matchThreshold: 0.7,
    matchCount: 5,
  });

  const [intentResult, searchResults] = await Promise.all([intentPromise, searchPromise]);

  // Step 3: Build context-aware prompt
  const contextPrompt = buildContextPrompt(context, searchResults, intentResult);

  // Step 4: Convert conversation history to Claude format
  const conversationMessages = buildConversationMessages(context.messages, userMessage);

  // Step 5: Generate response with Claude (primary) or OpenAI (fallback)
  let response: claude.ClaudeResponse;
  let modelUsed = 'claude';

  try {
    response = await claude.generateResponse(
      SYSTEM_PROMPT + '\n\n' + contextPrompt,
      conversationMessages,
      {
        maxTokens: getMaxTokensForIntent(intentResult.intent),
        temperature: 0.7,
      }
    );
  } catch (error) {
    console.error('Claude API error, falling back to OpenAI:', error);
    modelUsed = 'openai';

    const openaiMessages: openai.OpenAIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + contextPrompt },
      ...conversationMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const openaiResponse = await openai.generateResponse(openaiMessages, {
      maxTokens: getMaxTokensForIntent(intentResult.intent),
      temperature: 0.7,
    });

    response = {
      content: openaiResponse.content,
      model: openaiResponse.model,
      tokens_input: openaiResponse.tokens_input,
      tokens_output: openaiResponse.tokens_output,
      stop_reason: openaiResponse.finish_reason,
    };
  }

  // Step 6: Post-process response (ensure conciseness)
  const processedContent = postProcessResponse(response.content);

  return {
    content: processedContent,
    model: `${modelUsed}:${response.model}`,
    tokens_input: response.tokens_input,
    tokens_output: response.tokens_output,
    sources: searchResults,
    intent: intentResult.intent,
    lead_ready: intentResult.lead_ready,
    response_time_ms: Date.now() - startTime,
  };
}

function buildContextPrompt(
  context: ConversationContext,
  searchResults: SearchResult[],
  intentResult: { intent: string; vendor?: string; course_name?: string }
): string {
  const parts: string[] = [];

  // Add page context if available
  if (context.page_context) {
    parts.push(`## VISITOR CONTEXT
- Current Page: ${context.page_context.title || context.page_context.url}
- Page Type: ${context.page_context.type || 'unknown'}
${context.page_context.course_name ? `- Viewing Course: ${context.page_context.course_name}` : ''}`);
  }

  // Add collected visitor info
  if (context.collected_info.name || context.collected_info.email) {
    parts.push(`## VISITOR INFO (Already collected)
${context.collected_info.name ? `- Name: ${context.collected_info.name}` : ''}
${context.collected_info.email ? `- Email: ${context.collected_info.email}` : ''}
${context.collected_info.phone ? `- Phone: ${context.collected_info.phone}` : ''}
${context.collected_info.company ? `- Company: ${context.collected_info.company}` : ''}
${context.collected_info.interested_courses.length > 0 ? `- Interested In: ${context.collected_info.interested_courses.join(', ')}` : ''}`);
  }

  // Add intent context
  parts.push(`## DETECTED INTENT
- Intent: ${intentResult.intent}
${intentResult.vendor ? `- Vendor Interest: ${intentResult.vendor}` : ''}
${intentResult.course_name ? `- Course Mentioned: ${intentResult.course_name}` : ''}`);

  // Add relevant knowledge base results
  if (searchResults.length > 0) {
    const kbContext = searchResults
      .slice(0, 3)
      .map((r) => {
        let info = `### ${r.title}`;
        if (r.content) {
          info += `\n${r.content}`;
        }
        if (r.url) {
          info += `\nURL: ${r.url}`;
        }
        return info;
      })
      .join('\n\n');

    parts.push(`## RELEVANT KNOWLEDGE BASE INFO
Use this information to answer accurately. Include URLs when mentioning courses.

${kbContext}`);
  }

  return parts.join('\n\n');
}

function buildConversationMessages(
  messages: Message[],
  currentMessage: string
): claude.ClaudeMessage[] {
  // Convert message history to Claude format
  // Keep last 10 messages for context window management
  const recentMessages = messages.slice(-10);

  const claudeMessages: claude.ClaudeMessage[] = recentMessages.map((m) => ({
    role: m.role === 'visitor' ? 'user' : 'assistant',
    content: m.content,
  }));

  // Add current user message
  claudeMessages.push({
    role: 'user',
    content: currentMessage,
  });

  return claudeMessages;
}

function getMaxTokensForIntent(intent: string): number {
  // Adjust max tokens based on intent to enforce conciseness
  switch (intent) {
    case 'greeting':
    case 'farewell':
      return 100;
    case 'pricing':
    case 'schedule':
      return 200;
    case 'comparison':
    case 'career_advice':
      return 400;
    default:
      return 300;
  }
}

function postProcessResponse(content: string): string {
  // Remove any excessive whitespace
  let processed = content.trim();

  // Ensure no more than 2 consecutive newlines
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // Remove any AI self-references
  processed = processed.replace(/As an AI.*?\./gi, '');
  processed = processed.replace(/I('m| am) an AI.*?\./gi, '');

  // Ensure response ends properly
  if (!processed.endsWith('.') && !processed.endsWith('?') && !processed.endsWith('!')) {
    // Find last complete sentence
    const lastPeriod = processed.lastIndexOf('.');
    const lastQuestion = processed.lastIndexOf('?');
    const lastExclamation = processed.lastIndexOf('!');
    const lastComplete = Math.max(lastPeriod, lastQuestion, lastExclamation);

    if (lastComplete > processed.length * 0.5) {
      processed = processed.substring(0, lastComplete + 1);
    }
  }

  return processed;
}

// Extract lead information from conversation
export function extractLeadInfo(messages: Message[]): {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interested_courses: string[];
} {
  const info: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    interested_courses: string[];
  } = {
    interested_courses: [],
  };

  const allText = messages
    .filter((m) => m.role === 'visitor')
    .map((m) => m.content)
    .join(' ');

  // Extract email
  const emailMatch = allText.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    info.email = emailMatch[0];
  }

  // Extract phone (various formats)
  const phoneMatch = allText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    info.phone = phoneMatch[0];
  }

  // Extract name patterns (simple heuristic)
  const namePatterns = [
    /my name is (\w+(?:\s+\w+)?)/i,
    /i(?:'m| am) (\w+)/i,
    /call me (\w+)/i,
    /this is (\w+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = allText.match(pattern);
    if (match && match[1].length > 2) {
      info.name = match[1];
      break;
    }
  }

  return info;
}
