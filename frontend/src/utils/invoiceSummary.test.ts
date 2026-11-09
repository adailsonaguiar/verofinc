import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Invoice } from '../types';
import { getInvoiceSummary } from './invoiceSummary.ts';

test('fatura aberta com valor em aberto não aparece como paga mesmo sem transações carregadas', () => {
  const summary = getInvoiceSummary(
    { status: 'open' as Invoice['status'], totalAmount: 158532, paidAmount: 0 },
    0,
    0
  );

  assert.deepEqual(summary, { paid: false, total: 158532, amount: 158532 });
});

test('ausência de fatura e de transações não significa pagamento', () => {
  assert.deepEqual(getInvoiceSummary(undefined, 0, 0), {
    paid: false,
    total: 0,
    amount: 0,
  });
});

test('pagamento parcial mantém o saldo em aberto', () => {
  assert.deepEqual(
    getInvoiceSummary(
      { status: 'partially_paid' as Invoice['status'], totalAmount: 158532, paidAmount: 50000 },
      0,
      0
    ),
    { paid: false, total: 158532, amount: 108532 }
  );
});

test('somente o status pago confirma a quitação', () => {
  assert.deepEqual(
    getInvoiceSummary(
      { status: 'paid' as Invoice['status'], totalAmount: 158532, paidAmount: 158532 },
      158532,
      158532
    ),
    { paid: true, total: 158532, amount: 0 }
  );
});

test('sem fatura, calcula o saldo pelas transações sem inferir pagamento', () => {
  assert.deepEqual(getInvoiceSummary(undefined, 10000, 3000), {
    paid: false,
    total: 10000,
    amount: 7000,
  });
});

test('total exibido coincide com a impressão mesmo se pagamentos excedem as compras consultadas', () => {
  assert.deepEqual(getInvoiceSummary(undefined, 158532, 394778), {
    paid: false,
    total: 158532,
    amount: -236246,
  });
});
