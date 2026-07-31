import { PaymentType, PaymentScheduleItem, AbonoRecord, CreditStatus } from '../types';

export function getInstallmentCount(paymentType: PaymentType = 'contado'): number {
  if (paymentType === 'cuotas_2') return 2;
  if (paymentType === 'cuotas_4') return 4;
  return 1;
}

export function generatePaymentSchedule(
  total: number,
  paymentType: PaymentType = 'contado',
  startDateISO?: string
): PaymentScheduleItem[] {
  const count = getInstallmentCount(paymentType);
  const expectedPerInstallment = Math.round((total / count) * 100) / 100;

  const schedule: PaymentScheduleItem[] = [];
  const baseDate = startDateISO ? new Date(startDateISO) : new Date();

  for (let i = 1; i <= count; i++) {
    const dueDate = new Date(baseDate);
    if (paymentType === 'cuotas_2') {
      // Quincenal: +15 y +30 días
      dueDate.setDate(dueDate.getDate() + 15 * i);
    } else if (paymentType === 'cuotas_4') {
      // Semanal: +7, +14, +21, +28 días
      dueDate.setDate(dueDate.getDate() + 7 * i);
    } else {
      // Contado: 3 días de plazo por defecto
      dueDate.setDate(dueDate.getDate() + 3);
    }

    const isoDueDate = dueDate.toISOString().split('T')[0];
    schedule.push({
      installmentNumber: i,
      dueDate: isoDueDate,
      expectedAmount: expectedPerInstallment,
      paidAmount: 0,
      status: 'Pendiente',
    });
  }

  return schedule;
}

export function recalculateCreditState(
  total: number,
  schedule: PaymentScheduleItem[] = [],
  history: AbonoRecord[] = []
): {
  totalPaid: number;
  creditStatus: CreditStatus;
  updatedSchedule: PaymentScheduleItem[];
} {
  const totalPaid = history.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  let remainingPaidPool = totalPaid;
  const todayStr = new Date().toISOString().split('T')[0];

  const updatedSchedule = schedule.map(item => {
    if (remainingPaidPool >= item.expectedAmount) {
      remainingPaidPool -= item.expectedAmount;
      return {
        ...item,
        paidAmount: item.expectedAmount,
        status: 'Pagado' as const,
      };
    } else if (remainingPaidPool > 0) {
      const paid = remainingPaidPool;
      remainingPaidPool = 0;
      return {
        ...item,
        paidAmount: Math.round(paid * 100) / 100,
        status: 'Parcial' as const,
      };
    } else {
      return {
        ...item,
        paidAmount: 0,
        status: 'Pendiente' as const,
      };
    }
  });

  let creditStatus: CreditStatus = 'En Proceso';

  // Si cubrió todo el monto (o margen de redondeo de 1 centavo)
  if (totalPaid >= total - 0.05) {
    creditStatus = 'Pagado';
  } else {
    // Si hay alguna cuota sin completar cuya fecha venció
    const isOverdue = updatedSchedule.some(
      s => s.status !== 'Pagado' && s.dueDate < todayStr
    );
    creditStatus = isOverdue ? 'En Mora' : 'En Proceso';
  }

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    creditStatus,
    updatedSchedule,
  };
}
