// UI translations. English is the source; other languages fall back to English for any missing key.
// Jeff's chat replies are translated by the backend (it receives the language code).

export type LangCode = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'zh' | 'hi' | 'ar';

export interface LangInfo {
  code: LangCode;
  name: string;   // name in its own language, shown in the picker
  speech: string; // BCP-47 tag used to pick a read-aloud voice
  dir: 'ltr' | 'rtl';
}

export const LANGS: LangInfo[] = [
  { code: 'en', name: 'English', speech: 'en-US', dir: 'ltr' },
  { code: 'es', name: 'Español', speech: 'es-ES', dir: 'ltr' },
  { code: 'fr', name: 'Français', speech: 'fr-FR', dir: 'ltr' },
  { code: 'pt', name: 'Português', speech: 'pt-BR', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', speech: 'de-DE', dir: 'ltr' },
  { code: 'zh', name: '中文', speech: 'zh-CN', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', speech: 'hi-IN', dir: 'ltr' },
  { code: 'ar', name: 'العربية', speech: 'ar-SA', dir: 'rtl' },
];

export const langInfo = (code: LangCode) => LANGS.find((l) => l.code === code) ?? LANGS[0];

const en = {
  language: 'Language',
  demoScenarios: 'Demo scenarios',
  preset_romance: 'Romance scam',
  preset_charity: 'Fake charity',
  preset_coached: 'Coached',
  preset_influenced: "Won't listen",
  preset_worried: 'Worried for Ray',
  preset_legit: 'Normal payment',
  blurb_romance: 'Met online, big payment',
  blurb_charity: 'Urgent donation',
  blurb_coached: 'Told what to say',
  blurb_influenced: 'Sure it is safe',
  blurb_worried: 'Protect a relative',
  blurb_legit: 'Monthly rent',
  heroEyebrow: 'AI second look',
  heroTitle: 'Send money with confidence.',
  heroSub: 'Jeff pauses risky payments and talks them through with you.',
  sendMoney: 'Send money',
  name: 'Name',
  email: 'Email',
  amountSr: 'Amount in US dollars',
  paymentForSr: 'What is this payment for?',
  ffTitle: 'Friends and family',
  ffSub: 'No purchase protection',
  gsTitle: 'Goods and services',
  gsSub: 'Purchase protection may apply',
  note: 'Note',
  next: 'Next',
  reviewTitle: 'Review and send',
  jeffNoticed: 'Jeff noticed potential scam signals with this transfer.',
  reviewWithJeff: 'Review with Jeff',
  sendingTo: 'Sending to',
  change: 'Change',
  paymentType: 'Payment type',
  ffNoProtection: 'Friends and family (no buyer protection)',
  gsProtected: 'Goods and services (protected)',
  continueWithout: 'Or continue without PayPal checkout',
  result_sent: 'Payment sent',
  result_protected: 'Protected payment set up',
  result_cancelled: 'Payment cancelled',
  resultMsg_sent: 'Your payment was sent.',
  resultMsg_protected: 'The payment is now protected. The money is released when you confirm delivery.',
  resultMsg_cancelled: 'The payment was cancelled. No money was sent.',
  paypalRef: 'PayPal reference',
  openProtected: 'Open protected checkout',
  tryAnother: 'Try another scenario',
  askJeff: 'Ask Jeff',
  jeffWarning: 'Jeff has a warning',
  continueWithJeff: 'Continue with Jeff',
  openChat: 'Open chat with Jeff, an AI assistant',
  chatWithJeff: 'Chat with Jeff, AI assistant',
  highRisk: 'High risk alert',
  riskWarning: 'Risk warning',
  aiAssistant: 'AI assistant',
  voiceOn: 'Voice on',
  voiceOff: 'Voice off',
  minimize: 'Minimize chat',
  oneMoment: 'One moment…',
  jeffAi: 'Jeff (AI)',
  you: 'You',
  jeffTyping: 'Jeff is typing',
  tryAgain: 'Try again',
  suggestedReplies: 'Suggested replies',
  yourReply: 'Your reply to Jeff',
  typeAnswer: 'Type your answer…',
  send: 'Send',
  payProtected: 'Pay with protection',
  sendPayment: 'Send payment',
  sendAnyway: 'Send anyway',
  cancel: 'Cancel',
  customize: 'Customize Jeff',
  back: 'Back to chat',
  appearance: 'Appearance',
  style: 'Style',
  masculine: 'Masculine',
  feminine: 'Feminine',
  skinTone: 'Skin tone',
  hairColor: 'Hair color',
  voice: 'Voice',
  readAloud: 'Read replies aloud',
  voiceAuto: 'Automatic',
  noVoices: 'No voices for this language on this device. The browser default will be used.',
  pitch: 'Pitch',
  speed: 'Speed',
  preview: 'Preview voice',
  previewLine: "Hi, I'm Jeff, an AI assistant. I'm here to help you pay safely.",
  reset: 'Reset to default',
};

export type StringKey = keyof typeof en;
type Dict = Partial<Record<StringKey, string>>;

const es: Dict = {
  language: 'Idioma', demoScenarios: 'Escenarios de demostración', preset_romance: 'Estafa romántica', preset_charity: 'Falsa beneficencia', preset_coached: 'Aleccionado', preset_influenced: 'No escucha', preset_worried: 'Preocupado por Ray', preset_legit: 'Pago normal',
  blurb_romance: 'Conocido en línea, pago alto', blurb_charity: 'Donación urgente', blurb_coached: 'Le dijeron qué decir', blurb_influenced: 'Seguro de que es seguro', blurb_worried: 'Proteger a un familiar', blurb_legit: 'Alquiler mensual',
  heroEyebrow: 'Segunda mirada con IA', heroTitle: 'Envía dinero con confianza.', heroSub: 'Jeff pausa pagos riesgosos y los analiza contigo.',
  sendMoney: 'Enviar dinero', name: 'Nombre', email: 'Correo electrónico', amountSr: 'Importe en dólares estadounidenses', paymentForSr: '¿Para qué es este pago?',
  ffTitle: 'Amigos y familiares', ffSub: 'Sin protección de compra', gsTitle: 'Bienes y servicios', gsSub: 'Puede aplicar protección de compra', note: 'Nota', next: 'Siguiente',
  reviewTitle: 'Revisar y enviar', jeffNoticed: 'Jeff detectó posibles señales de estafa en esta transferencia.', reviewWithJeff: 'Revisar con Jeff', sendingTo: 'Enviar a', change: 'Cambiar',
  paymentType: 'Tipo de pago', ffNoProtection: 'Amigos y familiares (sin protección al comprador)', gsProtected: 'Bienes y servicios (protegido)', continueWithout: 'O continuar sin el pago de PayPal',
  result_sent: 'Pago enviado', result_protected: 'Pago protegido configurado', result_cancelled: 'Pago cancelado',
  resultMsg_sent: 'Tu pago fue enviado.', resultMsg_protected: 'El pago ahora está protegido. El dinero se libera cuando confirmes la entrega.', resultMsg_cancelled: 'El pago se canceló. No se envió dinero.',
  paypalRef: 'Referencia de PayPal', openProtected: 'Abrir pago protegido', tryAnother: 'Probar otro escenario',
  askJeff: 'Pregúntale a Jeff', jeffWarning: 'Jeff tiene una advertencia', continueWithJeff: 'Continuar con Jeff', openChat: 'Abrir chat con Jeff, un asistente de IA', chatWithJeff: 'Chat con Jeff, asistente de IA',
  highRisk: 'Alerta de alto riesgo', riskWarning: 'Aviso de riesgo', aiAssistant: 'Asistente de IA', voiceOn: 'Voz activada', voiceOff: 'Voz desactivada', minimize: 'Minimizar chat',
  oneMoment: 'Un momento…', jeffAi: 'Jeff (IA)', you: 'Tú', jeffTyping: 'Jeff está escribiendo', tryAgain: 'Intentar de nuevo', suggestedReplies: 'Respuestas sugeridas',
  yourReply: 'Tu respuesta a Jeff', typeAnswer: 'Escribe tu respuesta…', send: 'Enviar', payProtected: 'Pagar con protección', sendPayment: 'Enviar pago', sendAnyway: 'Enviar de todos modos', cancel: 'Cancelar',
  customize: 'Personalizar a Jeff', back: 'Volver al chat', appearance: 'Apariencia', style: 'Estilo', masculine: 'Masculino', feminine: 'Femenino', skinTone: 'Tono de piel', hairColor: 'Color de cabello',
  voice: 'Voz', readAloud: 'Leer respuestas en voz alta', voiceAuto: 'Automática', noVoices: 'No hay voces para este idioma en este dispositivo. Se usará la voz predeterminada del navegador.',
  pitch: 'Tono', speed: 'Velocidad', preview: 'Probar voz', previewLine: 'Hola, soy Jeff, un asistente de IA. Estoy aquí para ayudarte a pagar con seguridad.', reset: 'Restablecer',
};

const fr: Dict = {
  language: 'Langue', demoScenarios: 'Scénarios de démo', preset_romance: 'Arnaque sentimentale', preset_charity: 'Fausse association', preset_legit: 'Paiement normal',
  sendMoney: "Envoyer de l'argent", name: 'Nom', email: 'E-mail', amountSr: 'Montant en dollars américains', paymentForSr: 'À quoi sert ce paiement ?',
  ffTitle: 'Proches', ffSub: "Pas de protection d'achat", gsTitle: 'Biens et services', gsSub: "La protection d'achat peut s'appliquer", note: 'Note', next: 'Suivant',
  reviewTitle: 'Vérifier et envoyer', jeffNoticed: "Jeff a repéré des signes possibles d'arnaque dans ce transfert.", reviewWithJeff: 'Vérifier avec Jeff', sendingTo: 'Destinataire', change: 'Modifier',
  paymentType: 'Type de paiement', ffNoProtection: "Proches (sans protection de l'acheteur)", gsProtected: 'Biens et services (protégé)', continueWithout: 'Ou continuer sans le paiement PayPal',
  result_sent: 'Paiement envoyé', result_protected: 'Paiement protégé configuré', result_cancelled: 'Paiement annulé',
  resultMsg_sent: 'Votre paiement a été envoyé.', resultMsg_protected: "Le paiement est maintenant protégé. L'argent est versé quand vous confirmez la livraison.", resultMsg_cancelled: "Le paiement a été annulé. Aucun argent n'a été envoyé.",
  paypalRef: 'Référence PayPal', openProtected: 'Ouvrir le paiement protégé', tryAnother: 'Essayer un autre scénario',
  askJeff: 'Demander à Jeff', jeffWarning: 'Jeff a un avertissement', continueWithJeff: 'Continuer avec Jeff', openChat: 'Ouvrir le chat avec Jeff, un assistant IA', chatWithJeff: 'Chat avec Jeff, assistant IA',
  highRisk: 'Alerte risque élevé', riskWarning: 'Alerte de risque', aiAssistant: 'Assistant IA', voiceOn: 'Voix activée', voiceOff: 'Voix désactivée', minimize: 'Réduire le chat',
  oneMoment: 'Un instant…', jeffAi: 'Jeff (IA)', you: 'Vous', jeffTyping: 'Jeff écrit', tryAgain: 'Réessayer', suggestedReplies: 'Réponses suggérées',
  yourReply: 'Votre réponse à Jeff', typeAnswer: 'Tapez votre réponse…', send: 'Envoyer', payProtected: 'Payer avec protection', sendPayment: 'Envoyer le paiement', sendAnyway: 'Envoyer quand même', cancel: 'Annuler',
  customize: 'Personnaliser Jeff', back: 'Retour au chat', appearance: 'Apparence', style: 'Style', masculine: 'Masculin', feminine: 'Féminin', skinTone: 'Teint', hairColor: 'Couleur des cheveux',
  voice: 'Voix', readAloud: 'Lire les réponses à voix haute', voiceAuto: 'Automatique', noVoices: "Aucune voix pour cette langue sur cet appareil. La voix par défaut du navigateur sera utilisée.",
  pitch: 'Hauteur', speed: 'Vitesse', preview: 'Écouter la voix', previewLine: "Bonjour, je suis Jeff, un assistant IA. Je suis là pour vous aider à payer en toute sécurité.", reset: 'Réinitialiser',
};

const pt: Dict = {
  language: 'Idioma', demoScenarios: 'Cenários de demonstração', preset_romance: 'Golpe romântico', preset_charity: 'Falsa caridade', preset_legit: 'Pagamento normal',
  sendMoney: 'Enviar dinheiro', name: 'Nome', email: 'E-mail', amountSr: 'Valor em dólares americanos', paymentForSr: 'Para que é este pagamento?',
  ffTitle: 'Amigos e familiares', ffSub: 'Sem proteção de compra', gsTitle: 'Produtos e serviços', gsSub: 'Pode haver proteção de compra', note: 'Observação', next: 'Próximo',
  reviewTitle: 'Revisar e enviar', jeffNoticed: 'Jeff percebeu possíveis sinais de golpe nesta transferência.', reviewWithJeff: 'Revisar com Jeff', sendingTo: 'Enviando para', change: 'Alterar',
  paymentType: 'Tipo de pagamento', ffNoProtection: 'Amigos e familiares (sem proteção ao comprador)', gsProtected: 'Produtos e serviços (protegido)', continueWithout: 'Ou continuar sem o checkout do PayPal',
  result_sent: 'Pagamento enviado', result_protected: 'Pagamento protegido configurado', result_cancelled: 'Pagamento cancelado',
  resultMsg_sent: 'Seu pagamento foi enviado.', resultMsg_protected: 'O pagamento agora está protegido. O dinheiro é liberado quando você confirmar a entrega.', resultMsg_cancelled: 'O pagamento foi cancelado. Nenhum dinheiro foi enviado.',
  paypalRef: 'Referência do PayPal', openProtected: 'Abrir checkout protegido', tryAnother: 'Tentar outro cenário',
  askJeff: 'Pergunte ao Jeff', jeffWarning: 'Jeff tem um aviso', continueWithJeff: 'Continuar com o Jeff', openChat: 'Abrir chat com Jeff, um assistente de IA', chatWithJeff: 'Chat com Jeff, assistente de IA',
  highRisk: 'Alerta de alto risco', riskWarning: 'Aviso de risco', aiAssistant: 'Assistente de IA', voiceOn: 'Voz ligada', voiceOff: 'Voz desligada', minimize: 'Minimizar chat',
  oneMoment: 'Um momento…', jeffAi: 'Jeff (IA)', you: 'Você', jeffTyping: 'Jeff está digitando', tryAgain: 'Tentar novamente', suggestedReplies: 'Respostas sugeridas',
  yourReply: 'Sua resposta ao Jeff', typeAnswer: 'Digite sua resposta…', send: 'Enviar', payProtected: 'Pagar com proteção', sendPayment: 'Enviar pagamento', sendAnyway: 'Enviar mesmo assim', cancel: 'Cancelar',
  customize: 'Personalizar o Jeff', back: 'Voltar ao chat', appearance: 'Aparência', style: 'Estilo', masculine: 'Masculino', feminine: 'Feminino', skinTone: 'Tom de pele', hairColor: 'Cor do cabelo',
  voice: 'Voz', readAloud: 'Ler respostas em voz alta', voiceAuto: 'Automática', noVoices: 'Não há vozes para este idioma neste dispositivo. A voz padrão do navegador será usada.',
  pitch: 'Tom', speed: 'Velocidade', preview: 'Ouvir voz', previewLine: 'Olá, sou o Jeff, um assistente de IA. Estou aqui para ajudar você a pagar com segurança.', reset: 'Restaurar padrão',
};

const de: Dict = {
  language: 'Sprache', demoScenarios: 'Demo-Szenarien', preset_romance: 'Liebesbetrug', preset_charity: 'Falsche Spende', preset_legit: 'Normale Zahlung',
  sendMoney: 'Geld senden', name: 'Name', email: 'E-Mail', amountSr: 'Betrag in US-Dollar', paymentForSr: 'Wofür ist diese Zahlung?',
  ffTitle: 'Freunde und Familie', ffSub: 'Kein Käuferschutz', gsTitle: 'Waren und Dienstleistungen', gsSub: 'Käuferschutz kann gelten', note: 'Notiz', next: 'Weiter',
  reviewTitle: 'Prüfen und senden', jeffNoticed: 'Jeff hat mögliche Betrugsanzeichen bei dieser Überweisung bemerkt.', reviewWithJeff: 'Mit Jeff prüfen', sendingTo: 'Empfänger', change: 'Ändern',
  paymentType: 'Zahlungsart', ffNoProtection: 'Freunde und Familie (kein Käuferschutz)', gsProtected: 'Waren und Dienstleistungen (geschützt)', continueWithout: 'Oder ohne PayPal-Checkout fortfahren',
  result_sent: 'Zahlung gesendet', result_protected: 'Geschützte Zahlung eingerichtet', result_cancelled: 'Zahlung storniert',
  resultMsg_sent: 'Ihre Zahlung wurde gesendet.', resultMsg_protected: 'Die Zahlung ist jetzt geschützt. Das Geld wird freigegeben, wenn Sie den Erhalt bestätigen.', resultMsg_cancelled: 'Die Zahlung wurde storniert. Es wurde kein Geld gesendet.',
  paypalRef: 'PayPal-Referenz', openProtected: 'Geschützten Checkout öffnen', tryAnother: 'Anderes Szenario testen',
  askJeff: 'Jeff fragen', jeffWarning: 'Jeff hat eine Warnung', continueWithJeff: 'Weiter mit Jeff', openChat: 'Chat mit Jeff öffnen, einem KI-Assistenten', chatWithJeff: 'Chat mit Jeff, KI-Assistent',
  highRisk: 'Warnung: hohes Risiko', riskWarning: 'Risikowarnung', aiAssistant: 'KI-Assistent', voiceOn: 'Stimme an', voiceOff: 'Stimme aus', minimize: 'Chat minimieren',
  oneMoment: 'Einen Moment…', jeffAi: 'Jeff (KI)', you: 'Sie', jeffTyping: 'Jeff schreibt', tryAgain: 'Erneut versuchen', suggestedReplies: 'Antwortvorschläge',
  yourReply: 'Ihre Antwort an Jeff', typeAnswer: 'Antwort eingeben…', send: 'Senden', payProtected: 'Mit Schutz bezahlen', sendPayment: 'Zahlung senden', sendAnyway: 'Trotzdem senden', cancel: 'Abbrechen',
  customize: 'Jeff anpassen', back: 'Zurück zum Chat', appearance: 'Aussehen', style: 'Stil', masculine: 'Männlich', feminine: 'Weiblich', skinTone: 'Hautton', hairColor: 'Haarfarbe',
  voice: 'Stimme', readAloud: 'Antworten vorlesen', voiceAuto: 'Automatisch', noVoices: 'Auf diesem Gerät gibt es keine Stimme für diese Sprache. Die Standardstimme des Browsers wird verwendet.',
  pitch: 'Tonhöhe', speed: 'Tempo', preview: 'Stimme anhören', previewLine: 'Hallo, ich bin Jeff, ein KI-Assistent. Ich helfe Ihnen, sicher zu bezahlen.', reset: 'Zurücksetzen',
};

const zh: Dict = {
  language: '语言', demoScenarios: '演示场景', preset_romance: '恋爱诈骗', preset_charity: '虚假慈善', preset_legit: '正常付款',
  sendMoney: '汇款', name: '姓名', email: '电子邮箱', amountSr: '金额（美元）', paymentForSr: '这笔付款的用途是什么？',
  ffTitle: '亲友转账', ffSub: '无购物保障', gsTitle: '商品和服务', gsSub: '可能享有购物保障', note: '备注', next: '下一步',
  reviewTitle: '确认并发送', jeffNoticed: 'Jeff 发现这笔转账可能存在诈骗迹象。', reviewWithJeff: '与 Jeff 一起检查', sendingTo: '收款人', change: '更改',
  paymentType: '付款类型', ffNoProtection: '亲友转账（无买家保障）', gsProtected: '商品和服务（受保障）', continueWithout: '或不使用 PayPal 结账继续',
  result_sent: '付款已发送', result_protected: '已设置受保障付款', result_cancelled: '付款已取消',
  resultMsg_sent: '您的付款已发送。', resultMsg_protected: '这笔付款现已受到保障。您确认收货后款项才会放出。', resultMsg_cancelled: '付款已取消，没有发送任何款项。',
  paypalRef: 'PayPal 参考号', openProtected: '打开受保障结账', tryAnother: '试试其他场景',
  askJeff: '问问 Jeff', jeffWarning: 'Jeff 有一条提醒', continueWithJeff: '继续与 Jeff 对话', openChat: '打开与 AI 助手 Jeff 的聊天', chatWithJeff: '与 AI 助手 Jeff 聊天',
  highRisk: '高风险提醒', riskWarning: '风险提醒', aiAssistant: 'AI 助手', voiceOn: '语音开', voiceOff: '语音关', minimize: '最小化聊天',
  oneMoment: '请稍候…', jeffAi: 'Jeff（AI）', you: '您', jeffTyping: 'Jeff 正在输入', tryAgain: '重试', suggestedReplies: '建议回复',
  yourReply: '您给 Jeff 的回复', typeAnswer: '输入您的回答…', send: '发送', payProtected: '使用保障付款', sendPayment: '发送付款', sendAnyway: '仍然发送', cancel: '取消',
  customize: '自定义 Jeff', back: '返回聊天', appearance: '外观', style: '风格', masculine: '男性', feminine: '女性', skinTone: '肤色', hairColor: '发色',
  voice: '语音', readAloud: '朗读回复', voiceAuto: '自动', noVoices: '此设备上没有该语言的语音，将使用浏览器默认语音。',
  pitch: '音调', speed: '语速', preview: '试听语音', previewLine: '你好，我是 Jeff，一个 AI 助手。我会帮助你安全付款。', reset: '恢复默认',
};

const hi: Dict = {
  language: 'भाषा', demoScenarios: 'डेमो परिदृश्य', preset_romance: 'रोमांस घोटाला', preset_charity: 'नकली चैरिटी', preset_legit: 'सामान्य भुगतान',
  sendMoney: 'पैसे भेजें', name: 'नाम', email: 'ईमेल', amountSr: 'अमेरिकी डॉलर में राशि', paymentForSr: 'यह भुगतान किसलिए है?',
  ffTitle: 'मित्र और परिवार', ffSub: 'खरीद सुरक्षा नहीं', gsTitle: 'वस्तुएँ और सेवाएँ', gsSub: 'खरीद सुरक्षा लागू हो सकती है', note: 'नोट', next: 'आगे',
  reviewTitle: 'जाँचें और भेजें', jeffNoticed: 'Jeff को इस ट्रांसफ़र में संभावित धोखाधड़ी के संकेत मिले हैं।', reviewWithJeff: 'Jeff के साथ जाँचें', sendingTo: 'किसे भेज रहे हैं', change: 'बदलें',
  paymentType: 'भुगतान का प्रकार', ffNoProtection: 'मित्र और परिवार (खरीदार सुरक्षा नहीं)', gsProtected: 'वस्तुएँ और सेवाएँ (सुरक्षित)', continueWithout: 'या PayPal चेकआउट के बिना जारी रखें',
  result_sent: 'भुगतान भेजा गया', result_protected: 'सुरक्षित भुगतान सेट हुआ', result_cancelled: 'भुगतान रद्द हुआ',
  resultMsg_sent: 'आपका भुगतान भेज दिया गया।', resultMsg_protected: 'भुगतान अब सुरक्षित है। डिलीवरी की पुष्टि करने पर पैसा जारी होगा।', resultMsg_cancelled: 'भुगतान रद्द कर दिया गया। कोई पैसा नहीं भेजा गया।',
  paypalRef: 'PayPal संदर्भ', openProtected: 'सुरक्षित चेकआउट खोलें', tryAnother: 'दूसरा परिदृश्य आज़माएँ',
  askJeff: 'Jeff से पूछें', jeffWarning: 'Jeff की एक चेतावनी है', continueWithJeff: 'Jeff के साथ जारी रखें', openChat: 'AI सहायक Jeff के साथ चैट खोलें', chatWithJeff: 'AI सहायक Jeff के साथ चैट',
  highRisk: 'उच्च जोखिम चेतावनी', riskWarning: 'जोखिम चेतावनी', aiAssistant: 'AI सहायक', voiceOn: 'आवाज़ चालू', voiceOff: 'आवाज़ बंद', minimize: 'चैट छोटा करें',
  oneMoment: 'एक क्षण…', jeffAi: 'Jeff (AI)', you: 'आप', jeffTyping: 'Jeff लिख रहा है', tryAgain: 'फिर से कोशिश करें', suggestedReplies: 'सुझाए गए जवाब',
  yourReply: 'Jeff को आपका जवाब', typeAnswer: 'अपना जवाब लिखें…', send: 'भेजें', payProtected: 'सुरक्षा के साथ भुगतान करें', sendPayment: 'भुगतान भेजें', sendAnyway: 'फिर भी भेजें', cancel: 'रद्द करें',
  customize: 'Jeff को अनुकूलित करें', back: 'चैट पर वापस', appearance: 'रूप', style: 'शैली', masculine: 'पुरुष', feminine: 'महिला', skinTone: 'त्वचा का रंग', hairColor: 'बालों का रंग',
  voice: 'आवाज़', readAloud: 'जवाब ज़ोर से पढ़ें', voiceAuto: 'स्वचालित', noVoices: 'इस डिवाइस पर इस भाषा की कोई आवाज़ नहीं है। ब्राउज़र की डिफ़ॉल्ट आवाज़ इस्तेमाल होगी।',
  pitch: 'स्वर', speed: 'गति', preview: 'आवाज़ सुनें', previewLine: 'नमस्ते, मैं Jeff हूँ, एक AI सहायक। मैं सुरक्षित भुगतान में आपकी मदद के लिए यहाँ हूँ।', reset: 'डिफ़ॉल्ट पर लौटें',
};

const ar: Dict = {
  language: 'اللغة', demoScenarios: 'سيناريوهات تجريبية', preset_romance: 'احتيال عاطفي', preset_charity: 'جمعية خيرية مزيفة', preset_legit: 'دفعة عادية',
  sendMoney: 'إرسال الأموال', name: 'الاسم', email: 'البريد الإلكتروني', amountSr: 'المبلغ بالدولار الأمريكي', paymentForSr: 'ما الغرض من هذه الدفعة؟',
  ffTitle: 'الأصدقاء والعائلة', ffSub: 'بدون حماية للمشتريات', gsTitle: 'السلع والخدمات', gsSub: 'قد تنطبق حماية المشتريات', note: 'ملاحظة', next: 'التالي',
  reviewTitle: 'المراجعة والإرسال', jeffNoticed: 'لاحظ Jeff علامات احتيال محتملة في هذا التحويل.', reviewWithJeff: 'راجع مع Jeff', sendingTo: 'الإرسال إلى', change: 'تغيير',
  paymentType: 'نوع الدفع', ffNoProtection: 'الأصدقاء والعائلة (بدون حماية للمشتري)', gsProtected: 'السلع والخدمات (محمية)', continueWithout: 'أو تابع بدون الدفع عبر PayPal',
  result_sent: 'تم إرسال الدفعة', result_protected: 'تم إعداد دفعة محمية', result_cancelled: 'تم إلغاء الدفعة',
  resultMsg_sent: 'تم إرسال دفعتك.', resultMsg_protected: 'الدفعة محمية الآن. سيتم تحرير المبلغ عند تأكيدك للاستلام.', resultMsg_cancelled: 'تم إلغاء الدفعة. لم يتم إرسال أي أموال.',
  paypalRef: 'مرجع PayPal', openProtected: 'فتح الدفع المحمي', tryAnother: 'جرّب سيناريو آخر',
  askJeff: 'اسأل Jeff', jeffWarning: 'لدى Jeff تحذير', continueWithJeff: 'تابع مع Jeff', openChat: 'افتح المحادثة مع Jeff، مساعد ذكاء اصطناعي', chatWithJeff: 'محادثة مع Jeff، مساعد ذكاء اصطناعي',
  highRisk: 'تنبيه خطر مرتفع', riskWarning: 'تحذير من المخاطر', aiAssistant: 'مساعد ذكاء اصطناعي', voiceOn: 'الصوت مفعّل', voiceOff: 'الصوت متوقف', minimize: 'تصغير المحادثة',
  oneMoment: 'لحظة من فضلك…', jeffAi: 'Jeff (ذكاء اصطناعي)', you: 'أنت', jeffTyping: 'Jeff يكتب', tryAgain: 'حاول مرة أخرى', suggestedReplies: 'ردود مقترحة',
  yourReply: 'ردك على Jeff', typeAnswer: 'اكتب إجابتك…', send: 'إرسال', payProtected: 'ادفع مع الحماية', sendPayment: 'إرسال الدفعة', sendAnyway: 'أرسل على أي حال', cancel: 'إلغاء',
  customize: 'تخصيص Jeff', back: 'العودة إلى المحادثة', appearance: 'المظهر', style: 'النمط', masculine: 'ذكوري', feminine: 'أنثوي', skinTone: 'لون البشرة', hairColor: 'لون الشعر',
  voice: 'الصوت', readAloud: 'قراءة الردود بصوت عالٍ', voiceAuto: 'تلقائي', noVoices: 'لا توجد أصوات لهذه اللغة على هذا الجهاز. سيتم استخدام الصوت الافتراضي للمتصفح.',
  pitch: 'طبقة الصوت', speed: 'السرعة', preview: 'استمع إلى الصوت', previewLine: 'مرحبًا، أنا Jeff، مساعد ذكاء اصطناعي. أنا هنا لمساعدتك على الدفع بأمان.', reset: 'إعادة الضبط',
};

const DICTS: Record<LangCode, Dict> = { en, es, fr, pt, de, zh, hi, ar };

export function translate(lang: LangCode, key: StringKey): string {
  return DICTS[lang]?.[key] ?? en[key];
}

// Best guess at the visitor's language on first load.
export function detectLang(): LangCode {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase();
  return (LANGS.some((l) => l.code === nav) ? nav : 'en') as LangCode;
}
