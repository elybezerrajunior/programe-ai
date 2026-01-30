import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import dotenv from 'dotenv';

function loadEnvLocalIfNeeded(): void {
  if (typeof process !== 'undefined' && process.env && !process.env.ASAAS_API_KEY) {
    try {
      // Garantir .env.local em dev (proxy Cloudflare pode não herdar process.env do Vite)
      dotenv.config({ path: '.env.local' });
      dotenv.config({ path: '.env' });
    } catch {
      // edge/workers
    }
  }
}

interface AsaasConfig {
  apiKey: string;
  apiUrl: string;
}

export interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface AsaasPayment {
  customer: string; // ID do cliente no ASAAS
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'DEBIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
}

export interface AsaasSubscription {
  customer: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

export interface AsaasCheckoutItem {
  name: string;
  description?: string;
  quantity: number;
  value: number;
}

export interface AsaasCheckoutCallback {
  successUrl: string;
  cancelUrl?: string;
  expiredUrl?: string;
  autoRedirect?: boolean;
}

export interface AsaasCheckoutSubscription {
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  nextDueDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (opcional)
}

export interface AsaasCheckout {
  billingTypes: ('PIX' | 'CREDIT_CARD' | 'BOLETO')[];
  chargeTypes: ('DETACHED' | 'INSTALLMENT' | 'RECURRENT')[];
  items: AsaasCheckoutItem[];
  callback: AsaasCheckoutCallback;
  minutesToExpire?: number;
  maxInstallmentCount?: number;
  externalReference?: string;
  // Para assinaturas (RECURRENT) - objeto subscription é obrigatório
  subscription?: AsaasCheckoutSubscription;
  // Dados do cliente (opcional - se não informar, cliente preenche no checkout)
  customer?: string; // ID do cliente já cadastrado
  customerData?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    phone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    postalCode?: string;
    province?: string;
    city?: number;
  };
}

export interface AsaasCheckoutApiResponse {
  id: string;
  link?: string; // URL do checkout retornada pela API
  status?: string;
  expirationDate?: string;
  minutesToExpire?: number;
}

export interface AsaasCheckoutResponse {
  id: string;
  url?: string;
  link?: string;
  status?: string;
  expirationDate?: string;
  externalReference?: string;
  items?: Array<{ value: number; quantity?: number }>;
  customer?: string;
}

export class AsaasService {
  private config: AsaasConfig;

  constructor(context?: ActionFunctionArgs['context']) {
    loadEnvLocalIfNeeded();
    //(context as unknown as { cloudflare?: { env?: NodeJS.ProcessEnv } })?.cloudflare?.env ?? process.env;
    const cloudflareEnv = (context as unknown as { cloudflare?: { env?: NodeJS.ProcessEnv } })?.cloudflare?.env;
    // Em dev com Cloudflare proxy, context.cloudflare.env pode estar vazio; usar process.env (.env.local)
    const env = cloudflareEnv ?? process.env;
    const apiKey = (cloudflareEnv?.ASAAS_API_KEY || process.env?.ASAAS_API_KEY) ?? '';
    const apiUrl = (cloudflareEnv?.ASAAS_API_URL || process.env?.ASAAS_API_URL) ?? 'https://api-sandbox.asaas.com/v3';

    this.config = {
      apiKey,
      apiUrl,
    };

    if (!this.config.apiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.errors?.[0]?.description || errorData.message || errorText || response.statusText;
      } catch {
        errorMessage = errorText || response.statusText;
      }
      console.error(`ASAAS API Error [${response.status}]:`, errorMessage);
      throw new Error(`ASAAS API Error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Criar cliente no ASAAS
   */
  async createCustomer(customer: AsaasCustomer) {
    return this.request<{ id: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  /**
   * Buscar cliente no ASAAS
   */
  async getCustomer(customerId: string) {
    return this.request<AsaasCustomer & { id: string }>(`/customers/${customerId}`);
  }

  /**
   * Atualizar cliente no ASAAS
   */
  async updateCustomer(customerId: string, customer: Partial<AsaasCustomer>) {
    return this.request<{ id: string }>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  /**
   * Criar pagamento único
   */
  async createPayment(payment: AsaasPayment) {
    return this.request<{ id: string; invoiceUrl: string; status: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  /**
   * Criar assinatura
   */
  async createSubscription(subscription: AsaasSubscription) {
    return this.request<{ id: string; status: string }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string) {
    return this.request<{ id: string; status: string }>(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Buscar assinatura
   */
  async getSubscription(subscriptionId: string) {
    return this.request<{ id: string; status: string; currentCycle: any }>(
      `/subscriptions/${subscriptionId}`
    );
  }

  /**
   * Buscar pagamento
   */
  async getPayment(paymentId: string) {
    return this.request<{ id: string; status: string; value: number }>(`/payments/${paymentId}`);
  }

  /**
   * Criar checkout nativo do ASAAS
   * Redireciona o cliente para a página de pagamento segura do ASAAS
   */
  async createCheckout(checkout: AsaasCheckout): Promise<AsaasCheckoutResponse> {
    const apiResponse = await this.request<AsaasCheckoutApiResponse>('/checkouts', {
      method: 'POST',
      body: JSON.stringify(checkout),
    });
    console.log('[ASAAS] Checkout API response:', JSON.stringify(apiResponse, null, 2));
    
    // A API retorna o campo 'link' com a URL completa do checkout
    // Se não vier, construímos manualmente
    let checkoutUrl = apiResponse.link;
    if (!checkoutUrl) {
      const isSandbox = this.config.apiUrl.includes('sandbox');
      const checkoutBaseUrl = isSandbox 
        ? 'https://sandbox.asaas.com/checkoutSession/show'
        : 'https://asaas.com/checkoutSession/show';
      checkoutUrl = `${checkoutBaseUrl}/${apiResponse.id}`;
    }
    
    return {
      id: apiResponse.id,
      url: checkoutUrl,
      status: apiResponse.status,
      expirationDate: apiResponse.expirationDate,
    };
  }

  /**
   * Buscar checkout
   */
  async getCheckout(checkoutId: string) {
    return this.request<AsaasCheckoutResponse>(`/checkouts/${checkoutId}`);
  }

  /**
   * Buscar cliente por email
   */
  async findCustomerByEmail(email: string) {
    return this.request<{ data: Array<{ id: string } & AsaasCustomer> }>(`/customers?email=${encodeURIComponent(email)}`);
  }
}
