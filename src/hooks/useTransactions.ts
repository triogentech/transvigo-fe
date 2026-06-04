import { useCallback, useEffect, useState } from 'react';
import * as transactionsApi from '../api/transactions.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateTransactionBody, Transaction, TransactionFilters } from '../types/api.types';

export function useTransactions(initialFilters?: TransactionFilters) {
  const [all, setAll] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionsApi.getTransactions();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (t: Transaction) =>
    (!filters.type || t.type === filters.type) &&
    (!filters.txnTowards || t.txnTowards === filters.txnTowards) &&
    (!filters.transactionStatus || t.transactionStatus === filters.transactionStatus) &&
    (!filters.tripId || t.tripId === filters.tripId);

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createTransaction = async (body: CreateTransactionBody) => {
    const transaction = await transactionsApi.createTransaction(body);
    await refetch();
    return transaction;
  };
  const updateTransaction = async (id: string, body: Partial<CreateTransactionBody>) => {
    const transaction = await transactionsApi.updateTransaction(id, body);
    await refetch();
    return transaction;
  };
  const deleteTransaction = async (id: string) => {
    await transactionsApi.deleteTransaction(id);
    await refetch();
  };

  return {
    transactions: page.data, meta: page.meta, allTransactions: all,
    loading, error, filters, setFilters, refetch,
    createTransaction, updateTransaction, deleteTransaction,
  };
}
