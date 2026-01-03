/**
 * OpenAI Service
 *
 * Client wrapper for OpenAI GPT-4 API.
 * Used for AI-powered profile version generation.
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a chat completion with GPT-4
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
  } = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 2000,
    responseFormat = 'json',
  } = options;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content;
}

/**
 * Generate with retry logic for rate limits
 */
export async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
    maxRetries?: number;
    initialDelayMs?: number;
  } = {}
): Promise<string> {
  const { maxRetries = 3, initialDelayMs = 1000, ...completionOptions } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateChatCompletion(systemPrompt, userPrompt, completionOptions);
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      if (
        error instanceof OpenAI.RateLimitError ||
        (error instanceof Error && error.message.includes('rate limit'))
      ) {
        console.warn(`OpenAI rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Failed to generate after retries');
}

/**
 * Parse JSON response safely
 */
export function parseJsonResponse<T>(response: string): T {
  try {
    return JSON.parse(response) as T;
  } catch {
    throw new Error('Failed to parse OpenAI JSON response');
  }
}

/**
 * Helper: Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if OpenAI API is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
