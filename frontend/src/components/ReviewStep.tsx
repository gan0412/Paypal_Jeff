import type { Payment } from '../types';

interface Props {
  payment: Payment;
  held: boolean;
  chatOpen: boolean;
  onBack: () => void;
  onSend: () => void;
  onOpenChat: () => void;
}

const money = (n: number, c: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);

export function ReviewStep({ payment, held, chatOpen, onBack, onSend, onOpenChat }: Props) {
  const ff = payment.payment_type === 'friends_family';
  return (
    <div className="flow">
      <div className="screen">
        <h1 className="title">Review and send</h1>
        <p className="amount-big">
          <span className="cur">$</span>{money(payment.amount, payment.currency).replace('$', '')}<span className="cur-code">{payment.currency}</span>
        </p>

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

        <button type="button" className="primary wide gold" onClick={onSend} disabled={held}>
          {held ? 'On hold' : 'Send payment now'}
        </button>
      </div>
    </div>
  );
}
