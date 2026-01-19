import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

export const onRequest: PagesFunction = async (context) => {
  try {
    const serverBuild = (await import('../build/server')) as unknown as ServerBuild;

    if (!serverBuild) {
      console.error('[CLOUDFLARE_PAGES] Server build is null or undefined');
      return new Response('Server build not found', { status: 500 });
    }

    const handler = createPagesFunctionHandler({
      build: serverBuild,
    });

    return handler(context);
  } catch (error) {
    console.error('[CLOUDFLARE_PAGES] Error in onRequest:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });

    return new Response(
      `<!DOCTYPE html><html><head><title>Server Error</title></head><body><h1>Server Error</h1><p>Failed to load server build: ${error instanceof Error ? error.message : String(error)}</p></body></html>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      },
    );
  }
};
