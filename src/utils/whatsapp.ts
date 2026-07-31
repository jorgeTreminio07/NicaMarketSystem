import { CartItem, Order, PaymentType } from '../types';

export const STORE_WHATSAPP_NUMBER = '50589098184';

export function sanitizePhoneNumber(phone: string): string {
  // Remove non-numeric characters except leading plus if any
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If it starts without country code (e.g., 89098184 length 8 in Nicaragua), prepend 505
  if (cleaned.length === 8) {
    cleaned = '505' + cleaned;
  }
  return cleaned;
}

export function formatPaymentMethodText(paymentType: PaymentType = 'contado', total: number): string {
  if (paymentType === 'cuotas_2') {
    const quotaAmount = total / 2;
    return `A cuotas - 2 pagos quincenales de C$ ${quotaAmount.toFixed(2)} c/u`;
  }
  if (paymentType === 'cuotas_4') {
    const quotaAmount = total / 4;
    return `A cuotas - 4 pagos semanales de C$ ${quotaAmount.toFixed(2)} c/u`;
  }
  return `De contado (1 solo pago de C$ ${total.toFixed(2)})`;
}

export function generateOrderWhatsAppUrl(
  customerName: string,
  customerPhone: string,
  items: CartItem[],
  total: number,
  orderNumber?: string,
  paymentType: PaymentType = 'contado',
  targetPhoneNumber?: string
): string {
  let text = `*¡NUEVO PEDIDO DE COMPRA!* 🛍️\n\n`;
  if (orderNumber) {
    text += `📄 *Solicitud N°:* ${orderNumber}\n`;
  }
  text += `👤 *Cliente:* ${customerName}\n`;
  text += `📞 *Teléfono:* ${customerPhone}\n`;
  text += `💳 *Modalidad de Pago Solicitada:* ${formatPaymentMethodText(paymentType, total)}\n\n`;
  text += `📦 *Detalle del Pedido:*\n`;

  items.forEach(item => {
    const itemTotal = item.product.price * item.quantity;
    text += `• ${item.quantity}x ${item.product.name} - C$ ${item.product.price.toFixed(2)} (C$ ${itemTotal.toFixed(2)})\n`;
  });

  text += `\n💰 *Total a pagar:* C$ ${total.toFixed(2)}\n`;
  text += `\nQuedo a la espera de la confirmación de mi pedido. ¡Muchas gracias!`;

  const destPhone = sanitizePhoneNumber(targetPhoneNumber || STORE_WHATSAPP_NUMBER);
  return `https://wa.me/${destPhone}?text=${encodeURIComponent(text)}`;
}

export function generateApprovalWhatsAppUrl(order: Order): string {
  const customerPhoneClean = sanitizePhoneNumber(order.customerPhone);
  const solicitudNum = order.orderNumber || order.id.slice(0, 8);
  const paymentType = order.paymentType || 'contado';

  let text = `*¡SU PEDIDO HA SIDO APROBADO!* 🎉✅\n\n`;
  text += `Hola *${order.customerName}*,\n`;
  text += `Nos complace informarle que su solicitud de compra *N° ${solicitudNum}* ha sido *APROBADA*.\n\n`;
  text += `📋 *Resumen de su compra:*\n`;

  order.items.forEach(item => {
    text += `• ${item.quantity}x ${item.productName} (C$ ${(item.price * item.quantity).toFixed(2)})\n`;
  });

  text += `\n💵 *Total Final:* C$ ${order.total.toFixed(2)}\n`;
  text += `💳 *Modalidad de Pago Aprobada:* ${formatPaymentMethodText(paymentType, order.total)}\n`;
  text += `\nEstamos coordinando la entrega de sus productos. ¡Gracias por preferirnos!`;

  return `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`;
}

export function generateRejectionWhatsAppUrl(order: Order): string {
  const customerPhoneClean = sanitizePhoneNumber(order.customerPhone);
  const solicitudNum = order.orderNumber || order.id.slice(0, 8);

  let text = `*INFORMACIÓN DE SU PEDIDO* ℹ️\n\n`;
  text += `Hola *${order.customerName}*,\n`;
  text += `Le informamos sobre su solicitud de compra *N° ${solicitudNum}* por C$ ${order.total.toFixed(2)}.\n`;
  text += `Lamentablemente en este momento no ha podido ser procesada. Si tiene dudas, contáctenos directamente por este medio.`;

  return `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`;
}
