import type { ScenarioPreset } from './types';

// One-click demo presets. All names, amounts and addresses are made up.
export const PRESETS: ScenarioPreset[] = [
  {
    id: 'romance',
    label: 'Romance scam',
    blurb: 'Large payment to someone met online',
    payment: {
      amount: 2400,
      currency: 'USD',
      recipient_name: 'Daniel Reyes',
      recipient_email: 'daniel.reyes.88@example.com',
      recipient_is_new: true,
      note: 'for your flight to come see me, love you',
      payment_type: 'friends_family',
    },
  },
  {
    id: 'charity',
    label: 'Fake charity',
    blurb: 'Urgent donation after a cold message',
    payment: {
      amount: 500,
      currency: 'USD',
      recipient_name: 'Hope4Children Relief',
      recipient_email: 'give@hope4children-relief.example.com',
      recipient_is_new: true,
      note: 'urgent donation',
      payment_type: 'friends_family',
    },
  },
  {
    id: 'legit',
    label: 'Normal payment',
    blurb: 'Rent to a roommate you pay every month',
    payment: {
      amount: 850,
      currency: 'USD',
      recipient_name: 'Priya Shah',
      recipient_email: 'priya.shah@example.com',
      recipient_is_new: false,
      note: 'November rent',
      payment_type: 'friends_family',
    },
  },
];
