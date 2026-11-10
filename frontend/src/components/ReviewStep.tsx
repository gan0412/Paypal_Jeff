import { PayPalButtons } from '@paypal/react-paypal-js';
import type { Payment } from '../types';
import { usePrefs } from '../prefs';

interface Props {
  payment: Payment;
  isConcerned: boolean;
  chatOpen: boolean;
  onBack: () => void;
  onSend: () => void;
  onOpenChat: () => void;
  onPayPalSuccess: (orderId: string) => void;
}

const money = (n: number, c: string, lang: string) =>
  new Intl.NumberFormat(lang, { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' }).format(n);

export function ReviewStep({
  payment,
  isConcerned,
  chatOpen,
  onBack,
  onSend,
  onOpenChat,
  onPayPalSuccess,
}: Props) {
  const { t, lang } = usePrefs();
  const ff = payment.payment_type === 'friends_family';

  return (
    <div className="flow">
      <div className="screen">
        <h1 className="title">{t('reviewTitle')}</h1>
        <p className="amount-big">
          {money(payment.amount, payment.currency, lang)}
          <span className="cur-code">{payment.currency}</span>
        </p>

        {isConcerned && (
          <div
            role="status"
            style={{
              margin: '12px 0 16px',
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: '#fff0f0',
              border: '1px solid #ffd1d1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c0392b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚠️</span> {t('jeffNoticed')}
            </span>
            {!chatOpen && (
              <button
                type="button"
                className="linkbtn"
                onClick={onOpenChat}
                style={{ fontSize: 13, whiteSpace: 'nowrap' }}
              >
                {t('reviewWithJeff')}
              </button>
            )}
          </div>
        )}

        <dl className="rows">
          <div className="row">
            <dt>{t('sendingTo')}</dt>
            <dd>{payment.recipient_name}</dd>
            <button type="button" className="linkbtn" onClick={onBack}>
              {t('change')}
            </button>
          </div>
          <div className="row">
            <dt>{t('paymentType')}</dt>
            <dd>{ff ? t('ffNoProtection') : t('gsProtected')}</dd>
            <button type="button" className="linkbtn" onClick={onBack}>
              {t('change')}
            </button>
          </div>
          {payment.note && (
            <div className="row">
              <dt>{t('note')}</dt>
              <dd>{payment.note}</dd>
            </div>
          )}
        </dl>

        <div className="paypal-btn-wrap" style={{ marginTop: 20 }}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              shape: 'pill',
              color: 'gold',
              tagline: false,
            }}
            disabled={false}
            forceReRender={[payment.amount, payment.currency, payment.payment_type]}
            onClick={(_data, actions) => {
              // Respect user agency: never block the payment
              return actions.resolve();
            }}
            createOrder={(_data, actions) => {
              return actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [
                  {
                    amount: {
                      currency_code: payment.currency,
                      value: payment.amount.toFixed(2),
                    },
                    description: payment.note || `Payment to ${payment.recipient_name}`,
                    custom_id: isConcerned ? 'JEFF_ALERT_HIGH_RISK' : 'JEFF_CLEARED_LOW_RISK',
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              let orderId = data.orderID;
              try {
                if (actions.order) {
                  const details = await actions.order.capture();
                  orderId = details.id || orderId;
                }
              } catch (e) {
                console.warn('PayPal capture notice:', e);
              }
              onPayPalSuccess(orderId);
            }}
            onError={(err) => {
              console.warn('PayPal Buttons error/warning:', err);
            }}
          />
        </div>

        <button
          type="button"
          className="linkbtn center"
          onClick={onSend}
          style={{ marginTop: 10, fontSize: 13 }}
        >
          {t('continueWithout')}
        </button>
      </div>
    </div>
  );
}
