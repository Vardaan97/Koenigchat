import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization to avoid build-time errors
let anthropicInstance: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  stop_reason: string | null;
}

export async function generateResponse(
  systemPrompt: string,
  messages: ClaudeMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<ClaudeResponse> {
  const model = options?.model || 'claude-sonnet-4-20250514';
  const maxTokens = options?.maxTokens || 500; // Keep responses concise
  const temperature = options?.temperature ?? 0.7;

  const response = await getAnthropic().messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find((c) => c.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  return {
    content,
    model: response.model,
    tokens_input: response.usage.input_tokens,
    tokens_output: response.usage.output_tokens,
    stop_reason: response.stop_reason,
  };
}

export async function classifyIntent(
  message: string,
  classificationPrompt: string
): Promise<{
  intent: string;
  vendor?: string;
  course_name?: string;
  urgency: string;
  lead_ready: boolean;
}> {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514', // Fast model for classification
    max_tokens: 200,
    temperature: 0,
    system: classificationPrompt,
    messages: [{ role: 'user', content: message }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '{}';

  try {
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Default classification if parsing fails
  }

  return {
    intent: 'unclear',
    urgency: 'medium',
    lead_ready: false,
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Note: Claude doesn't have a native embedding API
  // We'll use OpenAI for embeddings - see openai.ts
  throw new Error('Use OpenAI for embeddings');
}
