
const blueprints = import.meta.glob('/app/blueprints/*.md', { query: '?raw', import: 'default' });

export async function getBlueprintContent(id: string, name: string): Promise<string> {
    const path = `/app/blueprints/${id}.md`;

    if (blueprints[path]) {
        try {
            const content = await blueprints[path]();
            return content as string;
        } catch (error) {
            console.error(`Failed to load blueprint for ${id}`, error);
        }
    }

    // Fallback to default message if file not found
    return `Quero construir um sistema completo para ${name}.\nGere o Blueprint detalhado e o plano de construção.`;
}
