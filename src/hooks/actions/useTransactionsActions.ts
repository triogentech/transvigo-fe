import { useCallback } from 'react';
import * as transactionsApi from '../../api/transactions.api';
import type { CreateTransactionBody } from '../../api/transactions.api';
import { invalidatePageCache } from '../usePageCache';

function invalidateTransactions(): void {
  invalidatePageCache('/api/pages/transactions');
  invalidatePageCache('/api/pages/dashboard');
}

export function useTransactionsActions() {
  const createTransaction = useCallback(
    async (body: CreateTransactionBody) => {
      const result = await transactionsApi.createTransaction(body);
      invalidateTransactions();
      return result;
    },
    [],
  );

  const updateTransaction = useCallback(
    async (id: string, body: Partial<CreateTransactionBody>) => {
      const result = await transactionsApi.updateTransaction(id, body);
      invalidateTransactions();
      return result;
    },
    [],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const result = await transactionsApi.deleteTransaction(id);
      invalidateTransactions();
      return result;
    },
    [],
  );

  return { createTransaction, updateTransaction, deleteTransaction };
}
