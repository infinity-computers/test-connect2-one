export type PlanCategory = 'Premium' | 'Budget' | 'Eco';
export type Duration = '3m' | '6m' | '12m';

export interface PlanVariant {
  duration: Duration;
  months: number;
  price: number;
}

export interface Plan {
  id: string;
  category: PlanCategory;
  speed: number;
  variants: PlanVariant[];
  features: string[];
  badge?: string;
}

const premiumFeatures = [
  'VIP Priority Service',
  '4–24 Working Hours Resolution',
  'Dedicated Support Line',
  'Festival Offer Discounts',
  'Unlimited Data',
  'Static IP Available',
];

const budgetFeatures = [
  'Priority Support',
  '24–48 Working Hours Resolution',
  'Unlimited Data',
  'WhatsApp Support',
];

const ecoFeatures = [
  'Standard Support',
  '48–72 Working Hours Resolution',
  'Unlimited Data',
  'WhatsApp Support',
];

export const plans: Plan[] = [
  { id: 'PRE-40', category: 'Premium', speed: 40, badge: 'Popular', features: premiumFeatures, variants: [{ duration: '3m', months: 3, price: 3999 }, { duration: '6m', months: 6, price: 5999 }, { duration: '12m', months: 12, price: 7999 }] },
  { id: 'PRE-60', category: 'Premium', speed: 60, features: premiumFeatures, variants: [{ duration: '3m', months: 3, price: 4999 }, { duration: '6m', months: 6, price: 7499 }, { duration: '12m', months: 12, price: 9999 }] },
  { id: 'PRE-80', category: 'Premium', speed: 80, features: premiumFeatures, variants: [{ duration: '3m', months: 3, price: 5499 }, { duration: '6m', months: 6, price: 8199 }, { duration: '12m', months: 12, price: 11199 }] },
  { id: 'PRE-100', category: 'Premium', speed: 100, badge: 'Best Value', features: premiumFeatures, variants: [{ duration: '3m', months: 3, price: 5999 }, { duration: '6m', months: 6, price: 8999 }, { duration: '12m', months: 12, price: 12499 }] },

  { id: 'BUD-40', category: 'Budget', speed: 40, badge: 'Popular', features: budgetFeatures, variants: [{ duration: '3m', months: 3, price: 3499 }, { duration: '6m', months: 6, price: 4899 }, { duration: '12m', months: 12, price: 5999 }] },
  { id: 'BUD-60', category: 'Budget', speed: 60, features: budgetFeatures, variants: [{ duration: '3m', months: 3, price: 4199 }, { duration: '6m', months: 6, price: 5799 }, { duration: '12m', months: 12, price: 7199 }] },
  { id: 'BUD-80', category: 'Budget', speed: 80, features: budgetFeatures, variants: [{ duration: '3m', months: 3, price: 4599 }, { duration: '6m', months: 6, price: 6199 }, { duration: '12m', months: 12, price: 7999 }] },
  { id: 'BUD-100', category: 'Budget', speed: 100, badge: 'Best Value', features: budgetFeatures, variants: [{ duration: '3m', months: 3, price: 4999 }, { duration: '6m', months: 6, price: 6499 }, { duration: '12m', months: 12, price: 8499 }] },

  { id: 'ECO-40', category: 'Eco', speed: 40, badge: 'Starter', features: ecoFeatures, variants: [{ duration: '3m', months: 3, price: 2899 }, { duration: '6m', months: 6, price: 3899 }, { duration: '12m', months: 12, price: 4999 }] },
  { id: 'ECO-60', category: 'Eco', speed: 60, features: ecoFeatures, variants: [{ duration: '3m', months: 3, price: 3399 }, { duration: '6m', months: 6, price: 4699 }, { duration: '12m', months: 12, price: 5799 }] },
  { id: 'ECO-80', category: 'Eco', speed: 80, features: ecoFeatures, variants: [{ duration: '3m', months: 3, price: 3699 }, { duration: '6m', months: 6, price: 5099 }, { duration: '12m', months: 12, price: 6299 }] },
  { id: 'ECO-100', category: 'Eco', speed: 100, badge: 'Best Value', features: ecoFeatures, variants: [{ duration: '3m', months: 3, price: 4099 }, { duration: '6m', months: 6, price: 5499 }, { duration: '12m', months: 12, price: 6999 }] },
];
