import { type LoaderFunction } from '@remix-run/cloudflare';
import { requireAuth } from '~/lib/auth/session';

export const loader: LoaderFunction = async ({ request, context }) => {
  const env = (context?.cloudflare?.env as unknown as Record<string, string> | undefined) ?? undefined;
  await requireAuth(request, undefined, env ?? undefined);
  const url = new URL(request.url);
  const editorOrigin = url.searchParams.get('editorOrigin') || 'https://stackblitz.com';
  console.log('editorOrigin', editorOrigin);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Connect to WebContainer</title>
      </head>
      <body>
        <script type="module">
          (async () => {
            const { setupConnect } = await import('https://cdn.jsdelivr.net/npm/@webcontainer/api@latest/dist/connect.js');
            setupConnect({
              editorOrigin: '${editorOrigin}'
            });
          })();
        </script>
      </body>
    </html>
  `;

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
  });
};
