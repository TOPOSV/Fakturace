'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Euro, AlertCircle, TrendingUp, Users, Package } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/overview');
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Načítání...</div>;
  }

  if (!overview) {
    return <div className="flex items-center justify-center h-64">Nepodařilo se načíst data</div>;
  }

  const stats = [
    {
      title: 'Celkem faktur',
      value: overview.invoices.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Uhrazené faktury',
      value: overview.invoices.paid,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Neuhrazené faktury',
      value: overview.invoices.unpaid,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Po splatnosti',
      value: overview.invoices.overdue,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Celkové příjmy',
      value: formatCurrency(overview.revenue.total),
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Klienti',
      value: overview.stats.clients,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Přehled vašeho fakturačního systému</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Příjmy a výdaje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Celkové příjmy</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(overview.revenue.total)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uhrazeno</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(overview.revenue.paid)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">K úhradě</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(overview.revenue.unpaid)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rychlé akce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/invoices/new')}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-left text-white transition hover:bg-blue-700"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Vytvořit fakturu</div>
                    <div className="text-sm text-blue-100">Nová faktura pro klienta</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => router.push('/clients/new')}
                className="w-full rounded-lg bg-white px-4 py-3 text-left border border-gray-200 transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Přidat klienta</div>
                    <div className="text-sm text-gray-500">Nový odběratel nebo dodavatel</div>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
