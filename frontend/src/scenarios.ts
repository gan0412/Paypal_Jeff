import type { ScenarioPreset } from './types';

// One-click scenario presets. All names, amounts and addresses are made up.
export const PRESETS: ScenarioPreset[] = [
  {
    id: 'romance',
    label: 'Romance scam',
    blurb: 'Met online, big payment',
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
    blurb: 'Urgent donation',
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
    id: 'coached',
    label: 'Coached',
    blurb: 'Told what to say',
    payment: {
      amount: 3000,
      currency: 'USD',
      recipient_name: 'Marcus Webb',
      recipient_email: 'marcus.webb.help@example.com',
      recipient_is_new: true,
      note: 'family emergency',
      payment_type: 'friends_family',
    },
  },
  {
    id: 'influenced',
    label: "Won't listen",
    blurb: 'Sure it is safe',
    payment: {
      amount: 5000,
      currency: 'USD',
      recipient_name: 'Capital Edge Trading',
      recipient_email: 'deposits@capitaledge-trading.example.com',
      recipient_is_new: true,
      note: 'investment deposit',
      payment_type: 'goods_services',
    },
  },
  {
    id: 'worried',
    label: 'Worried for Ray',
    blurb: 'Protect a relative',
    payment: {
      amount: 1500,
      currency: 'USD',
      recipient_name: 'Ray Thompson',
      recipient_email: 'ray.thompson@example.com',
      recipient_is_new: false,
      note: "Ray's prize fee",
      payment_type: 'friends_family',
    },
  },
  {
    id: 'legit',
    label: 'Normal payment',
    blurb: 'Monthly rent',
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
