import type { AppLoadContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';

// Helper para log detalhado de erros
function logError(context: string, error: unknown, request?: Request) {
  const errorDetails = {
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : typeof error,
    url: request?.url,
    method: request?.method,
    timestamp: new Date().toISOString(),
  };

  console.error('[ENTRY_SERVER_ERROR]', JSON.stringify(errorDetails, null, 2));
  
  if (error instanceof Error && error.stack) {
    console.error('[STACK_TRACE]', error.stack);
  }
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  console.log('[ENTRY_SERVER] Starting request:', {
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });

  try {
    let readable: ReadableStream<Uint8Array> & { allReady?: Promise<void> };
    
    try {
      console.log('[ENTRY_SERVER] Creating readable stream...');
      readable = (await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
        signal: request.signal,
        onError(error: unknown) {
          logError('renderToReadableStream.onError', error, request);
          responseStatusCode = 500;
        },
      })) as ReadableStream<Uint8Array> & { allReady?: Promise<void> };
      console.log('[ENTRY_SERVER] Readable stream created successfully');
    } catch (error) {
      logError('renderToReadableStream initialization', error, request);
      throw error;
    }

    const body = new ReadableStream({
      start(controller) {
        try {
          console.log('[ENTRY_SERVER] Rendering head...');
          let head: string;
          
          try {
            head = renderHeadToString({ request, remixContext, Head });
            console.log('[ENTRY_SERVER] Head rendered successfully, length:', head.length);
          } catch (headError) {
            logError('renderHeadToString', headError, request);
            // Fallback: usar head vazio se renderHeadToString falhar
            head = '';
          }
          
          const theme = themeStore.get() || 'dark';
          console.log('[ENTRY_SERVER] Theme:', theme);
          
          const htmlStart = `<!DOCTYPE html><html lang="en" data-theme="${theme}"><head>${head}</head><body><div id="root" class="w-full h-full">`;
          controller.enqueue(
            new Uint8Array(new TextEncoder().encode(htmlStart)),
          );
          console.log('[ENTRY_SERVER] HTML start enqueued');
        } catch (error) {
          logError('head rendering', error, request);
          const theme = 'dark';
          const htmlStart = `<!DOCTYPE html><html lang="en" data-theme="${theme}"><head></head><body><div id="root" class="w-full h-full">`;
          controller.enqueue(
            new Uint8Array(new TextEncoder().encode(htmlStart)),
          );
        }

        const reader = readable.getReader();

        function read() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                console.log('[ENTRY_SERVER] Stream complete');
                controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
                controller.close();
                return;
              }

              controller.enqueue(value);
              read();
            })
            .catch((error) => {
              logError('stream reading', error, request);
              try {
                controller.error(error);
              } catch (controllerError) {
                console.error('[ENTRY_SERVER] Error in controller.error:', controllerError);
              }
              try {
                readable.cancel();
              } catch (cancelError) {
                console.error('[ENTRY_SERVER] Error cancelling readable:', cancelError);
              }
            });
        }
        read();
      },

      cancel() {
        console.log('[ENTRY_SERVER] Stream cancelled');
        try {
          readable.cancel();
        } catch (error) {
          console.error('[ENTRY_SERVER] Error cancelling stream:', error);
        }
      },
    });

    if (isbot(request.headers.get('user-agent') || '')) {
      console.log('[ENTRY_SERVER] Waiting for bot rendering...');
      try {
        if (readable.allReady) {
          await readable.allReady;
          console.log('[ENTRY_SERVER] Bot rendering complete');
        }
      } catch (error) {
        logError('readable.allReady', error, request);
      }
    }

    responseHeaders.set('Content-Type', 'text/html');
    responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    console.log('[ENTRY_SERVER] Request completed successfully:', {
      status: responseStatusCode,
      url: request.url,
    });

    return new Response(body, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  } catch (error) {
    logError('handleRequest top-level', error, request);
    
    // Retornar uma resposta de erro básica para que o Cloudflare possa logar
    return new Response(
      `<!DOCTYPE html><html><head><title>Server Error</title></head><body><h1>Server Error</h1><p>An error occurred while processing your request.</p></body></html>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      },
    );
  }
}
