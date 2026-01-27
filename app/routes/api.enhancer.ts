import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

const logger = createScopedLogger('api.enhancher');

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, model, provider } = await request.json<{
    message: string;
    model: string;
    provider: ProviderInfo;
    apiKeys?: Record<string, string>;
  }>();

  const { name: providerName } = provider;

  // validate 'model' and 'provider' fields
  if (!model || typeof model !== 'string') {
    throw new Response('Invalid or missing model', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Invalid or missing provider', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content:
            `[Model: ${model}]\n\n[Provider: ${providerName}]\n\n` +
            stripIndents`
            You are a professional prompt engineer specialized in transforming user prompts into clear, precise, and highly effective instructions.
            Your task is to improve the user prompt enclosed within the \`<original_prompt>\` tags, while **preserving the original intent and responding strictly in the same language used in the original prompt**.

            ## Instructions for valid prompts
            - Rewrite the prompt to be explicit, unambiguous, and actionable  
            - Add any necessary context, constraints, or clarifications  
            - Remove redundancy and vague language  
            - Maintain the original goal and meaning  
            - Ensure the final prompt is fully self-contained  
            - Use professional, clear, and concise language  

            ## Instructions for invalid, incomplete, or unclear prompts
            - Respond in the same language as the original prompt  
            - Provide clear, professional, and constructive guidance  
            - Focus only on what information is missing or needs clarification  
            - Keep the response concise and actionable  
            - Follow a consistent and neutral structure  

            ## Mandatory rules
            - **Always respond in the same language as the original prompt**  
            - Output **only** the improved prompt text  
            - Do **not** include explanations, comments, metadata, formatting notes, or wrapper tags  
            - Do **not** reference the analysis process or the original instructions  

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      env: context.cloudflare?.env as any,
      apiKeys,
      providerSettings,
      options: {
        system:
          'You are a senior principal software architect responsible for refining user prompts; analyze the user’s query and enrich it with all necessary context, assumptions, constraints, and clarifications to make it more specific, actionable, and effective while preserving the original intent; **always respond strictly in the same language used by the user in their original query**; make requirements explicit and unambiguous, add relevant technical, functional, or architectural constraints when needed, remove vague or redundant information, ensure the enhanced prompt is fully self-contained, and use clear, professional, and precise language; output **only** the enhanced prompt text and do **not** include explanations, comments, metadata, analysis, wrapper tags, or references to these instructions or your role.',

        /*
         * onError: (event) => {
         *   throw new Response(null, {
         *     status: 500,
         *     statusText: 'Internal Server Error',
         *   });
         * }
         */
      },
    });

    // Handle streaming errors in a non-blocking way
    (async () => {
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'error') {
            const error: any = part.error;
            logger.error('Streaming error:', error);
            break;
          }
        }
      } catch (error) {
        logger.error('Error processing stream:', error);
      }
    })();

    // Return the text stream directly since it's already text data
    return new Response(result.textStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.log(error);

    if (error instanceof Error && error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
