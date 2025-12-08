'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchInvoices();
  }, [router]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      paid: 'Uhrazeno',
      unpaid: 'Neuhrazeno',
      overdue: 'Po splatnosti',
      cancelled: 'Stornováno',
    };

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || styles.unpaid}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Načítání...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-600">Správa faktur</p>
        </div>
        <Button onClick={() => router.push('/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nová faktura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seznam faktur</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>Zatím nemáte žádné faktury</p>
              <Button 
                onClick={() => router.push('/invoices/new')} 
                className="mt-4"
                variant="outline"
              >
                Vytvořit první fakturu
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">Číslo</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">Klient</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">Datum vystavení</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-600">Splatnost</th>
                    <th className="pb-3 text-right text-sm font-medium text-gray-600">Částka</th>
                    <th className="pb-3 text-center text-sm font-medium text-gray-600">Stav</th>
                    <th className="pb-3 text-right text-sm font-medium text-gray-600">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {invoice.client?.name || 'N/A'}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="py-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-4 text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
