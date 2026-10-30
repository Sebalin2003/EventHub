import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '../entities/order.entity.js';

export interface IOrderState {
  readonly status: OrderStatus;
  pay(): OrderStatus;
  cancel(): OrderStatus;
  refund(): OrderStatus;
}

export class PendingOrderState implements IOrderState {
  readonly status = OrderStatus.PENDING;

  pay(): OrderStatus {
    return OrderStatus.PAID;
  }

  cancel(): OrderStatus {
    return OrderStatus.CANCELLED;
  }

  refund(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: No se puede reembolsar una orden que se encuentra en estado PENDING (no pagada).'
    );
  }
}

export class PaidOrderState implements IOrderState {
  readonly status = OrderStatus.PAID;

  pay(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: La orden ya se encuentra en estado PAID.'
    );
  }

  cancel(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: Una orden pagada (PAID) no puede cancelarse directamente, debe solicitarse reembolso (REFUNDED).'
    );
  }

  refund(): OrderStatus {
    return OrderStatus.REFUNDED;
  }
}

export class CancelledOrderState implements IOrderState {
  readonly status = OrderStatus.CANCELLED;

  pay(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: No es posible pagar una orden que ha sido cancelada (CANCELLED).'
    );
  }

  cancel(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: La orden ya se encuentra cancelada (CANCELLED).'
    );
  }

  refund(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: No se puede reembolsar una orden que nunca fue pagada y está cancelada (CANCELLED).'
    );
  }
}

export class RefundedOrderState implements IOrderState {
  readonly status = OrderStatus.REFUNDED;

  pay(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: No es posible pagar una orden que ya fue reembolsada (REFUNDED).'
    );
  }

  cancel(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: No es posible cancelar una orden que ya ha sido reembolsada (REFUNDED).'
    );
  }

  refund(): OrderStatus {
    throw new ConflictException(
      'Transición inválida de estado: La orden ya fue reembolsada con anterioridad.'
    );
  }
}

export function createOrderState(status: OrderStatus): IOrderState {
  switch (status) {
    case OrderStatus.PENDING:
      return new PendingOrderState();
    case OrderStatus.PAID:
      return new PaidOrderState();
    case OrderStatus.CANCELLED:
      return new CancelledOrderState();
    case OrderStatus.REFUNDED:
      return new RefundedOrderState();
    default:
      throw new ConflictException(`Transición inválida: Estado desconocido "${status}".`);
  }
}
