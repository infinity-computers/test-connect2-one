export type ComplaintStatus = 'open' | 'in_progress' | 'resolved';

export interface Complaint {
  id: string;
  issueType: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

export const issueTypes = [
  'Internet speed',
  'Downtime/outage',
  'Billing error',
  'Equipment fault',
  'New connection delay',
  'Poor signal',
  'Not working more than 4 hours',
  'Not working more than 24 hours',
  'Not working more than 48 hours',
  'Other',
];

export const mockComplaints: Complaint[] = [
  {
    id: 'CMP-2026-001',
    issueType: 'Downtime/outage',
    description: 'No internet since morning. All lights on ONU are red.',
    userId: 'USR001',
    userName: 'Ravi Patel',
    userEmail: 'ravi.patel@gmail.com',
    userPhone: '9876543210',
    status: 'open',
    createdAt: '2026-04-16T08:30:00',
    updatedAt: '2026-04-16T08:30:00',
  },
  {
    id: 'CMP-2026-002',
    issueType: 'Internet speed',
    description: 'Getting only 10 Mbps against 60 Mbps plan.',
    userId: 'USR002',
    userName: 'Meera Shah',
    userEmail: 'meera.shah@yahoo.com',
    userPhone: '9123456789',
    status: 'in_progress',
    createdAt: '2026-04-15T14:10:00',
    updatedAt: '2026-04-15T16:45:00',
  },
  {
    id: 'CMP-2026-003',
    issueType: 'Billing error',
    description: 'Was charged twice for the same renewal.',
    userId: 'USR004',
    userName: 'Pooja Trivedi',
    userEmail: 'pooja.t@hotmail.com',
    userPhone: '9765432109',
    status: 'open',
    createdAt: '2026-04-14T11:00:00',
    updatedAt: '2026-04-14T11:00:00',
  },
  {
    id: 'CMP-2026-004',
    issueType: 'Equipment fault',
    description: 'ONU device is not powering on after power cut.',
    userId: 'USR005',
    userName: 'Sunil Joshi',
    userEmail: 'sunil.joshi@gmail.com',
    userPhone: '9654321098',
    status: 'resolved',
    createdAt: '2026-04-10T09:00:00',
    updatedAt: '2026-04-12T15:30:00',
  },
  {
    id: 'CMP-2026-005',
    issueType: 'Not working more than 24 hours',
    description: 'Internet completely down for over 26 hours now.',
    userId: 'USR008',
    userName: 'Hina Vohra',
    userEmail: 'hina.vohra@gmail.com',
    userPhone: '9321098765',
    status: 'in_progress',
    createdAt: '2026-04-15T06:00:00',
    updatedAt: '2026-04-15T10:00:00',
  },
  {
    id: 'CMP-2026-006',
    issueType: 'New connection delay',
    description: 'Applied for new connection 2 weeks ago, still not installed.',
    userId: 'USR007',
    userName: 'Dinesh Prajapati',
    userEmail: 'dinesh.p@gmail.com',
    userPhone: '9432109876',
    status: 'open',
    createdAt: '2026-04-08T13:00:00',
    updatedAt: '2026-04-08T13:00:00',
  },
  {
    id: 'CMP-2026-007',
    issueType: 'Poor signal',
    description: 'Wi-Fi signal very weak in bedroom area.',
    userId: 'USR003',
    userName: 'Ankit Desai',
    userEmail: 'ankit.desai@gmail.com',
    userPhone: '9988776655',
    status: 'resolved',
    createdAt: '2026-04-05T10:30:00',
    updatedAt: '2026-04-06T14:00:00',
  },
];
