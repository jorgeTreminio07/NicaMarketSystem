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
  let text = `*NUEVO PEDIDO DE COMPRA*\n\n`;
  if (orderNumber) {
    text += `*Solicitud N°:* ${orderNumber}\n`;
  }
  text += `*Cliente:* ${customerName}\n`;
  text += `*Teléfono:* ${customerPhone}\n`;
  text += `*Modalidad de Pago Solicitada:* ${formatPaymentMethodText(paymentType, total)}\n\n`;
  text += `*Detalle del Pedido:*\n`;

  items.forEach(item => {
    const hasDiscount = Boolean(item.product.discountPercent && item.product.discountPercent > 0);
    const unitPrice = hasDiscount
      ? item.product.price * (1 - item.product.discountPercent! / 100)
      : item.product.price;
    const itemTotal = unitPrice * item.quantity;
    if (hasDiscount) {
      text += `• ${item.quantity}x ${item.product.name} - C$ ${unitPrice.toFixed(2)} c/u (-${item.product.discountPercent}% OFF) (Subtotal: C$ ${itemTotal.toFixed(2)})\n`;
    } else {
      text += `• ${item.quantity}x ${item.product.name} - C$ ${item.product.price.toFixed(2)} (C$ ${itemTotal.toFixed(2)})\n`;
    }
  });

  text += `\n*Total a pagar:* C$ ${total.toFixed(2)}\n`;
  text += `\nQuedo a la espera de la confirmación de mi pedido. Gracias.`;

  const destPhone = sanitizePhoneNumber(targetPhoneNumber || STORE_WHATSAPP_NUMBER);
  return `https://wa.me/${destPhone}?text=${encodeURIComponent(text)}`;
}

export function generateApprovalWhatsAppUrl(order: Order): string {
  const customerPhoneClean = sanitizePhoneNumber(order.customerPhone);
  const solicitudNum = order.orderNumber || order.id.slice(0, 8);
  const paymentType = order.paymentType || 'contado';

  let text = `*PEDIDO APROBADO*\n\n`;
  text += `Hola *${order.customerName}*,\n`;
  text += `Nos complace informarle que su solicitud de compra *N° ${solicitudNum}* ha sido *APROBADA*.\n\n`;
  text += `*Resumen de su compra:*\n`;

  order.items.forEach(item => {
    text += `• ${item.quantity}x ${item.productName} (C$ ${(item.price * item.quantity).toFixed(2)})\n`;
  });

  text += `\n*Total Final:* C$ ${order.total.toFixed(2)}\n`;
  text += `*Modalidad de Pago Aprobada:* ${formatPaymentMethodText(paymentType, order.total)}\n`;

  // List payment schedule ONLY for installment orders
  if (paymentType === 'cuotas_2' || paymentType === 'cuotas_4') {
    text += `\n*Fechas de Pago Programadas:*\n`;
    if (order.paymentSchedule && order.paymentSchedule.length > 0) {
      order.paymentSchedule.forEach(payment => {
        const dateFormatted = new Date(payment.dueDate).toLocaleDateString('es-NI', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const periodLabel = paymentType === 'cuotas_2' 
          ? `Cuota ${payment.installmentNumber} (15 días)` 
          : `Cuota ${payment.installmentNumber} (Semana ${payment.installmentNumber})`;
        text += `• ${periodLabel} (${dateFormatted}): C$ ${payment.expectedAmount.toFixed(2)}\n`;
      });
    } else {
      const numCuotas = paymentType === 'cuotas_2' ? 2 : 4;
      const quotaAmount = order.total / numCuotas;
      const intervalDays = paymentType === 'cuotas_2' ? 15 : 7;
      const baseDate = new Date(order.createdAt || Date.now());

      for (let i = 1; i <= numCuotas; i++) {
        const dueDate = new Date(baseDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
        const formattedDate = dueDate.toLocaleDateString('es-NI', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const periodLabel = paymentType === 'cuotas_2' ? `Cuota ${i} (15 días)` : `Cuota ${i} (Semana ${i})`;
        text += `• ${periodLabel}: ${formattedDate} - C$ ${quotaAmount.toFixed(2)}\n`;
      }
    }
  }

  // Cash or Bank transfer payment details
  text += `\n*Métodos de Pago Aceptados:*\n`;
  text += `Puede realizar su pago en efectivo o mediante transferencia bancaria a las siguientes cuentas:\n\n`;
  text += `*Lafise C$:* 138028153\n`;
  text += `*Lafise USD:* 131255322\n`;
  text += `*Billetera móvil Banpro:* 89061446\n`;
  text += `*Titular:* Patricia de los Angeles Ruiz Sarria\n\n`;
  text += `Estamos coordinando la entrega de sus productos. Gracias por preferirnos.`;

  return `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`;
}

export function generateRejectionWhatsAppUrl(order: Order): string {
  const customerPhoneClean = sanitizePhoneNumber(order.customerPhone);
  const solicitudNum = order.orderNumber || order.id.slice(0, 8);

  let text = `*INFORMACIÓN DE SU PEDIDO*\n\n`;
  text += `Hola *${order.customerName}*,\n`;
  text += `Le informamos sobre su solicitud de compra *N° ${solicitudNum}* por C$ ${order.total.toFixed(2)}.\n`;
  text += `Lamentablemente en este momento no ha podido ser procesada. Si tiene dudas, contáctenos directamente por este medio.`;

  return `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`;
}
