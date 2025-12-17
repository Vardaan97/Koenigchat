import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  finish_reason: string | null;
}

export async function generateResponse(
  messages: OpenAIMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<OpenAIResponse> {
  const model = options?.model || 'gpt-4o';
  const maxTokens = options?.maxTokens || 500;
  const temperature = options?.temperature ?? 0.7;

  const response = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  const choice = response.choices[0];

  return {
    content: choice.message.content || '',
    model: response.model,
    tokens_input: response.usage?.prompt_tokens || 0,
    tokens_output: response.usage?.completion_tokens || 0,
    finish_reason: choice.finish_reason,
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}
