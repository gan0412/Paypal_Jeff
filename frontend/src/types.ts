// Shapes match docs/API_CONTRACT.md (snake_case on purpose).

export type Mood = 'calm' | 'listening' | 'thinking' | 'concerned' | 'relieved';
export type RiskLevel = 'low' | 'elevated' | 'high';
export type Choice = 'continue' | 'protected' | 'cancel';
export type PaymentType = 'friends_family' | 'goods_services';

export interface Payment {
  amount: number;
  currency: string;
  recipient_name: string;
  recipient_email: string;
  recipient_is_new: boolean;
  note: string;
  payment_type: PaymentType; // how the sender chose to pay (friends & family has no purchase protection)
}

export interface RiskSignal {
  code: string;
  label: string;
  detail?: string;
}

export interface Risk {
  score: number;
  level: RiskLevel;
  signals: RiskSignal[];
}

export interface AgentTurn {
  message: string;
  mood: Mood;
  risk: Risk;
  quick_replies?: string[];
  recommended?: Choice | null;
  done: boolean;
}

export interface StartResponse extends AgentTurn {
  session_id: string;
}

export interface DecisionResult {
  status: 'sent' | 'protected' | 'cancelled';
  message: string;
  order_id?: string;
  approve_url?: string;
}

export interface ChatMessage {
  id: number;
  from: 'jeff' | 'user';
  text: string;
}

export interface ScenarioPreset {
  id: 'romance' | 'charity' | 'legit';
  label: string;
  blurb: string;
  payment: Payment;
}
