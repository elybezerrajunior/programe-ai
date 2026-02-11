import { atom } from 'nanostores';

export interface SubscriptionState {
  planType: 'free' | 'starter' | 'builder' | 'pro' | 'business' | 'enterprise';
  status: 'active' | 'canceled' | 'expired' | 'pending';
  isLoaded: boolean;
}

const initialState: SubscriptionState = {
  planType: 'free',
  status: 'active',
  isLoaded: false,
};

export const subscriptionStore = atom<SubscriptionState>(initialState);

export const updateSubscription = (updates: Partial<SubscriptionState>) => {
  subscriptionStore.set({ ...subscriptionStore.get(), ...updates });
};

export const loadSubscription = async () => {
  try {
    const response = await fetch('/api/subscription/get');
    if (response.ok) {
      const data = (await response.json()) as { subscription?: { planType?: string; status?: string } };
      if (data.subscription) {
        subscriptionStore.set({
          planType: (data.subscription.planType as SubscriptionState['planType']) || 'free',
          status: (data.subscription.status as SubscriptionState['status']) || 'active',
          isLoaded: true,
        });
      }
    }
  } catch (error) {
    console.error('Error loading subscription:', error);
    subscriptionStore.set({ ...subscriptionStore.get(), isLoaded: true });
  }
};

export const isPaidPlan = () => {
  const { planType } = subscriptionStore.get();
  return planType !== 'free';
};
