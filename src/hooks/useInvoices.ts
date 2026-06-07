import { useCallback, useEffect, useState } from 'react';
import * as invoicesApi from '../api/invoices.api';
import { errMessage } from '../api/client';
import type { CreateInvoiceBody, InvoiceStatus, SupplierInvoice } from '../types/api.types';

export function useInvoices() {
  const [all, setAll] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoicesApi.getInvoices();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createInvoice = async (body: CreateInvoiceBody) => {
    const inv = await invoicesApi.createInvoice(body);
    await refetch();
    return inv;
  };

  const recordPayment = async (id: string, status: InvoiceStatus, paidAmount?: number) => {
    const inv = await invoicesApi.recordPayment(id, status, paidAmount);
    await refetch();
    return inv;
  };

  return { allInvoices: all, loading, error, refetch, createInvoice, recordPayment };
}
