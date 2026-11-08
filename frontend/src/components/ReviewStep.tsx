import type { Payment } from '../types';

interface Props {
  payment: Payment;
  held: boolean;
  chatOpen: boolean;
  isConcerned?: boolean;
  nudge?: string;
  onBack: () => void;
  onSend: () => void;
  onOpenChat: () => void;
}

const money = (n: number, c: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);

export function ReviewStep({ payment, held, chatOpen, isConcerned = false, nudge, onBack, onSend, onOpenChat }: Props) {
  const ff = payment.payment_type === 'friends_family';
  return (
    <div className="flow">
      <div className="screen">
        <h1 className="title">Review and send</h1>
        <p className="amount-big">
          <span className="cur">$</span>{money(payment.amount, payment.currency).replace('$', '')}<span className="cur-code">{payment.currency}</span>
        </p>

        {isConcerned && (
          <div className="review-warning-card" role="alert">
            <div className="review-warning-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff" aria-hidden="true">
                <path d="M12 2.5L1.5 21h21L12 2.5z" />
                <line x1="12" y1="9" x2="12" y2="14" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="17.5" r="1.3" fill="#ff1f1f" />
              </svg>
            </div>
            <div className="review-warning-text">
              <strong>High Scam Risk Detected by Jeff</strong>
              <p>{nudge || "This transfer shows telltale signs of Authorized Push Payment fraud. Review with Jeff before authorizing."}</p>
            </div>
            <button type="button" className="review-warning-btn" onClick={onOpenChat}>Talk with Jeff</button>
          </div>
        )}

        {held && (
          <div className="hold" role="status">
            <span>Payment on hold</span>
            {!chatOpen && <button type="button" className="linkbtn" onClick={onOpenChat}>Open chat</button>}
          </div>
        )}

        <dl className="rows">
          <div className="row"><dt>Sending to</dt><dd>{payment.recipient_name}</dd>
            <button type="button" className="linkbtn" onClick={onBack}>Change</button></div>
          <div className="row"><dt>Payment type</dt><dd>{ff ? 'Friends and family' : 'Goods and services'}</dd>
            <button type="button" className="linkbtn" onClick={onBack}>Change</button></div>
          {payment.note && <div className="row"><dt>Note</dt><dd>{payment.note}</dd></div>}
        </dl>

        <button type="button" className="primary wide" onClick={onSend} disabled={held}>
          {held ? 'On hold' : 'Send payment now'}
        </button>
      </div>
    </div>
  );
}
