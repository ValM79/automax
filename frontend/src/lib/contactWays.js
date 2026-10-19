// How a Dealer lets buyers contact them (set on the Profile, shown in the Contact Us tab of the dealer page):
//   message   an in-site message about one of their live ads (on by default)
//   whatsapp  opens WhatsApp on their WhatsApp number (or their phone number if none is given)
//   email     opens the buyer's mail app on the contact email the dealer chose to show
export const DEFAULT_WAYS = { message: true, whatsapp: false, email: false };

export const waysOf = (w) => ({ ...DEFAULT_WAYS, ...(w && typeof w === 'object' ? w : {}) });

// "087 123 4567", "+353 87 123 4567" or "00353871234567" -> "353871234567" (what wa.me wants), or null if it is not a number.
export function whatsappDigits(number) {
  const raw = String(number || '').trim();
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '353' + d.slice(1);
  return d.length >= 8 && d.length <= 15 ? d : null;
}

export const whatsappLink = (number, text) => {
  const d = whatsappDigits(number);
  return d ? `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}` : null;
};

export const isEmail = (v) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(v || '').trim());
