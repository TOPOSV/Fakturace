import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      totalClients,
      totalProducts,
      totalOffers,
      totalOrders,
    ] = await Promise.all([
      this.prisma.invoice.count({ where: { userId } }),
      this.prisma.invoice.count({ where: { userId, status: 'paid' } }),
      this.prisma.invoice.count({ where: { userId, status: 'unpaid' } }),
      this.prisma.invoice.count({ 
        where: { 
          userId, 
          status: 'unpaid',
          dueDate: { lt: new Date() }
        } 
      }),
      this.prisma.client.count({ where: { type: 'customer' } }),
      this.prisma.product.count(),
      this.prisma.offer.count({ where: { userId } }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    const [totalRevenue, paidRevenue, unpaidRevenue] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { userId },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: { userId, status: 'paid' },
        _sum: { paidAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { userId, status: 'unpaid' },
        _sum: { total: true },
      }),
    ]);

    return {
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        unpaid: unpaidInvoices,
        overdue: overdueInvoices,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        paid: paidRevenue._sum.paidAmount || 0,
        unpaid: unpaidRevenue._sum.total || 0,
      },
      stats: {
        clients: totalClients,
        products: totalProducts,
        offers: totalOffers,
        orders: totalOrders,
      },
    };
  }

  async getMonthlyRevenue(userId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        issueDate: true,
        total: true,
        status: true,
      },
    });

    // Group by month
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      revenue: 0,
      paid: 0,
      unpaid: 0,
    }));

    invoices.forEach(invoice => {
      const month = invoice.issueDate.getMonth();
      const amount = Number(invoice.total);
      
      monthlyData[month].revenue += amount;
      if (invoice.status === 'paid') {
        monthlyData[month].paid += amount;
      } else {
        monthlyData[month].unpaid += amount;
      }
    });

    return monthlyData;
  }

  async getTopClients(userId: string, limit: number = 10) {
    const clients = await this.prisma.client.findMany({
      where: {
        type: 'customer',
        invoices: {
          some: {
            userId,
          },
        },
      },
      include: {
        invoices: {
          where: { userId },
          select: {
            total: true,
            status: true,
          },
        },
      },
    });

    const clientStats = clients.map(client => {
      const totalRevenue = client.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const paidRevenue = client.invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.total), 0);

      return {
        id: client.id,
        name: client.name,
        totalRevenue,
        paidRevenue,
        invoiceCount: client.invoices.length,
      };
    });

    return clientStats
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  async getOverdueInvoices(userId: string) {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        userId,
        status: 'unpaid',
        dueDate: { lt: new Date() },
      },
      include: {
        client: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return overdueInvoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.name,
      total: invoice.total,
      dueDate: invoice.dueDate,
      daysOverdue: Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getRecentActivity(userId: string, limit: number = 10) {
    const [recentInvoices, recentOffers, recentOrders] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { userId },
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.offer.findMany({
        where: { userId },
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.order.findMany({
        where: { userId },
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const activities = [
      ...recentInvoices.map(inv => ({
        type: 'invoice',
        id: inv.id,
        number: inv.invoiceNumber,
        client: inv.client.name,
        amount: inv.total,
        date: inv.createdAt,
        status: inv.status,
      })),
      ...recentOffers.map(offer => ({
        type: 'offer',
        id: offer.id,
        number: offer.offerNumber,
        client: offer.client.name,
        amount: offer.total,
        date: offer.createdAt,
        status: offer.status,
      })),
      ...recentOrders.map(order => ({
        type: 'order',
        id: order.id,
        number: order.orderNumber,
        client: order.client.name,
        amount: order.totalAmount,
        date: order.createdAt,
        status: order.status,
      })),
    ];

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }
}
