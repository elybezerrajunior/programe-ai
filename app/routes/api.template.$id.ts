import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getSupabaseClient } from '~/lib/auth/supabase-client';

export const loader = async ({ request, params, context }: LoaderFunctionArgs) => {
    const env = context?.cloudflare?.env as unknown as Record<string, string> | undefined;
    const { id } = params;

    if (!id) {
        return json({ error: 'Template ID required' }, { status: 400 });
    }

    const client = getSupabaseClient(env);

    if (!client) {
        console.error('Supabase client failed to initialize');
        return json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Buscar o template pelo ID
    const { data, error } = await client
        .from('templates')
        .select('content_snapshot, title')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching template:', error);
        return json({ error: 'Template not found or error fetching data' }, { status: 404 });
    }

    if (!data) {
        return json({ error: 'Template not found' }, { status: 404 });
    }

    return json({
        content: data.content_snapshot,
        title: data.title
    });
};
