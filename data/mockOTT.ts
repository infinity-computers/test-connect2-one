export interface OTTPlan {
  id: string;
  name: string;
  apps: string[];
  variants: { label: string; days: number; price: number }[];
  highlight?: string;
}

export const ottPlans: OTTPlan[] = [
  {
    id: 'OTT-1',
    name: 'Basic OTT Bundle',
    apps: ['Shemaroo', 'Hungama', 'iTap', 'Fancode', 'Distro TV', 'OM TV', 'PlayboxTV'],
    highlight: '350+ Live TV Channels',
    variants: [{ label: '30 Days', days: 30, price: 99 }],
  },
  {
    id: 'OTT-2',
    name: 'Standard OTT Bundle',
    apps: ['JioHotstar', 'SonyLiv Premium', 'Discovery+', 'PlayboxTV'],
    highlight: '350+ Live TV Channels',
    variants: [
      { label: '30 Days', days: 30, price: 121 },
      { label: '90 Days', days: 90, price: 350 },
      { label: '180 Days', days: 180, price: 580 },
      { label: '365 Days', days: 365, price: 999 },
    ],
  },
  {
    id: 'OTT-3',
    name: 'Premium OTT Bundle',
    apps: ['JioHotstar', 'SonyLiv', 'Zee5', 'Discovery+', 'Chaupal', 'PlayboxTV'],
    highlight: 'All Major OTT + Live TV',
    variants: [
      { label: '30 Days', days: 30, price: 240 },
      { label: '90 Days', days: 90, price: 690 },
      { label: '180 Days', days: 180, price: 1090 },
      { label: '365 Days', days: 365, price: 2150 },
    ],
  },
  {
    id: 'OTT-4',
    name: 'Ultra Premium OTT Bundle',
    apps: ['Amazon Prime Lite', 'JioHotstar', 'SonyLiv', 'Zee5', 'Discovery+', 'Chaupal', 'PlayboxTV'],
    highlight: 'Amazon Prime + All OTT + Live TV',
    variants: [
      { label: '30 Days', days: 30, price: 290 },
      { label: '90 Days', days: 90, price: 790 },
      { label: '180 Days', days: 180, price: 1290 },
      { label: '365 Days', days: 365, price: 2599 },
    ],
  },
];
