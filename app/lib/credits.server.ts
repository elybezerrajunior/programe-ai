import { createClient } from '@supabase/supabase-js';

// Definição dos tipos para ajudar no TypeScript
export interface UserCredits {
    userId: string;
    totalCredits: number;
    usedCredits: number;
    bonusCredits: number;
    dailyCreditsUsed: number;
    dailyCreditsAllowed: number;
}

const PLAN_CREDITS: Record<string, number> = {
    free: 200,
    starter: 200,
    builder: 700,
    pro: 1600,
    enterprise: 500,
};

const DAILY_CREDITS: Record<string, number> = {
    free: 0, // Free agora é 0 diários extras além dos 200 fixos se for o caso, mas seguindo a lógica do plans.tsx
    starter: 0,
    builder: 5,
    pro: 10,
    enterprise: 20,
};

// 1 Crédito = 1000 Tokens (Input + Output)
const TOKENS_PER_CREDIT = 1000;

/**
 * Busca o saldo de créditos do usuário.
 */
export async function getUserCredits(
    supabase: any,
    userId: string
): Promise<{ total: number; remaining: number } | null> {
    // Buscar créditos
    const { data: credits, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !credits) {
        return null;
    }

    // Buscar plano para saber limites diários e totais base
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', userId)
        .single();

    const planType = (subscription?.plan_type as string) || 'free';
    const dailyAllowed = DAILY_CREDITS[planType] || 0;

    // Calcular totais
    // Total Disponível = (Créditos do Plano + Bônus Comprados + (Diários Permitidos - Diários Usados))
    // Restante = Total Disponível - Total Usado (acumulado do mês/ciclo)

    // NOTA: A lógica original do plans.tsx parece misturar um pouco "used_credits" (uso total do ciclo) 
    // com "daily_credits_used", vamos alinhar.
    // daily_credits_used é resetado todo dia.
    // used_credits deve ser resetado todo mês (ciclo).

    const dailyUsed = credits.daily_credits_used || 0;
    const totalCreditsBase = (credits.total_credits || 0) + (credits.bonus_credits || 0);

    // Créditos diários disponíveis hoje
    const dailyRemaining = Math.max(0, dailyAllowed - dailyUsed);

    // Total real disponível para gastar agora = (Base - Usados do Ciclo) + Diários Restantes
    // Mas espera, se o plano free tem 200 créditos totais e 0 diários, ele gasta do total.
    // Se o plano Pro tem 1600 totais e 10 diários, ele gasta primeiro dos diários? 
    // Vamos assumir prioridade: Diários > Base.

    const baseRemaining = Math.max(0, totalCreditsBase - (credits.used_credits || 0));
    const totalRemaining = baseRemaining + dailyRemaining;

    return {
        total: totalRemaining, // Quanto ele pode gastar agora
        remaining: totalRemaining
    };
}

/**
 * Verifica se o usuário tem créditos suficientes para uma operação.
 * Se cost não for passado, verifica se tem > 0.
 */
export async function hasSufficientCredits(
    supabase: any,
    userId: string,
    estimatedCost: number = 1
): Promise<boolean> {
    const credits = await getUserCredits(supabase, userId);
    if (!credits) return false;
    return credits.remaining >= estimatedCost;
}

/**
 * Calcula o custo em créditos baseado em tokens.
 * Mínimo de 1 crédito por operação se houver uso de tokens.
 */
export function calculateCost(totalTokens: number): number {
    if (totalTokens <= 0) return 0;
    return Math.max(1, Math.ceil(totalTokens / TOKENS_PER_CREDIT));
}

/**
 * Deduz créditos do usuário.
 * Prioridade: Créditos Diários -> Créditos do Plano/Bônus.
 */
export async function deductCredits(
    supabase: any,
    userId: string,
    cost: number
): Promise<boolean> {
    if (cost <= 0) return true;

    // Precisamos ler o estado atual para saber de onde descontar
    const { data: credits, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !credits) {
        console.error('Erro ao buscar créditos para dedução:', error);
        return false;
    }

    // Buscar plano para saber limite diário
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', userId)
        .single();

    const planType = (subscription?.plan_type as string) || 'free';
    const dailyAllowed = DAILY_CREDITS[planType] || 0;

    let dailyUsed = credits.daily_credits_used || 0;
    let generalUsed = credits.used_credits || 0;

    let remainingCost = cost;

    // 1. Tentar descontar dos diários
    // Quantos diários ainda tem?
    const dailyRemaining = Math.max(0, dailyAllowed - dailyUsed);

    if (dailyRemaining > 0) {
        const deductFromDaily = Math.min(dailyRemaining, remainingCost);
        dailyUsed += deductFromDaily;
        remainingCost -= deductFromDaily;
    }

    // 2. Se sobrar custo, descontar do saldo geral (plano + bônus)
    if (remainingCost > 0) {
        generalUsed += remainingCost;
    }

    // Atualizar no banco
    const { error: updateError } = await supabase
        .from('user_credits')
        .update({
            daily_credits_used: dailyUsed,
            used_credits: generalUsed,
            // last_interaction_at: new Date().toISOString() // Opcional se tiver coluna
        })
        .eq('user_id', userId);

    if (updateError) {
        console.error('Erro ao atualizar créditos:', updateError);
        return false;
    }

    return true;
}
