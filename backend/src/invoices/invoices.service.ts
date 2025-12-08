import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createInvoiceDto: CreateInvoiceDto) {
    // Get user's company
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new BadRequestException('Company profile must be created first');
    }

    // Verify client exists
    const client = await this.prisma.client.findUnique({
      where: { id: createInvoiceDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Calculate totals
    let subtotal = new Decimal(0);
    let vatAmount = new Decimal(0);

    const items = createInvoiceDto.items.map(item => {
      const quantity = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const discount = new Decimal(item.discount || 0);
      const vatRate = new Decimal(item.vatRate);

      const itemSubtotal = quantity.mul(unitPrice).mul(new Decimal(1).sub(discount.div(100)));
      const itemVat = itemSubtotal.mul(vatRate.div(100));
      const itemTotal = itemSubtotal.add(itemVat);

      subtotal = subtotal.add(itemSubtotal);
      vatAmount = vatAmount.add(itemVat);

      return {
        ...item,
        total: itemTotal,
      };
    });

    const total = subtotal.add(vatAmount);

    // Generate invoice number
    const invoiceNumber = `${company.invoicePrefix}${String(company.nextInvoiceNum).padStart(6, '0')}`;

    // Calculate due date if not provided
    const issueDate = createInvoiceDto.issueDate ? new Date(createInvoiceDto.issueDate) : new Date();
    const dueDate = createInvoiceDto.dueDate 
      ? new Date(createInvoiceDto.dueDate)
      : new Date(issueDate.getTime() + (company.defaultDuedays * 24 * 60 * 60 * 1000));

    // Generate variable symbol if not provided
    const variableSymbol = createInvoiceDto.variableSymbol || invoiceNumber.replace(/\D/g, '');

    // Create invoice with items
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        type: createInvoiceDto.type || 'standard',
        userId,
        companyId: company.id,
        clientId: createInvoiceDto.clientId,
        orderId: createInvoiceDto.orderId,
        issueDate,
        dueDate,
        taxDate: issueDate,
        subtotal,
        vatAmount,
        total,
        currency: createInvoiceDto.currency || 'CZK',
        notes: createInvoiceDto.notes,
        variableSymbol,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount || 0,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        company: true,
      },
    });

    // Update company's next invoice number
    await this.prisma.company.update({
      where: { id: company.id },
      data: { nextInvoiceNum: company.nextInvoiceNum + 1 },
    });

    return invoice;
  }

  async findAll(userId: string, query?: any) {
    const where: any = { userId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.clientId) {
      where.clientId = query.clientId;
    }

    if (query?.type) {
      where.type = query.type;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        client: true,
        company: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(userId: string, id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const invoice = await this.findOne(userId, id);

    const updateData: any = {};

    if (updateInvoiceDto.status) {
      updateData.status = updateInvoiceDto.status;
    }

    if (updateInvoiceDto.dueDate) {
      updateData.dueDate = new Date(updateInvoiceDto.dueDate);
    }

    if (updateInvoiceDto.notes !== undefined) {
      updateData.notes = updateInvoiceDto.notes;
    }

    // If items are updated, recalculate totals
    if (updateInvoiceDto.items) {
      // Delete existing items
      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Calculate new totals
      let subtotal = new Decimal(0);
      let vatAmount = new Decimal(0);

      const items = updateInvoiceDto.items.map(item => {
        const quantity = new Decimal(item.quantity);
        const unitPrice = new Decimal(item.unitPrice);
        const discount = new Decimal(item.discount || 0);
        const vatRate = new Decimal(item.vatRate);

        const itemSubtotal = quantity.mul(unitPrice).mul(new Decimal(1).sub(discount.div(100)));
        const itemVat = itemSubtotal.mul(vatRate.div(100));
        const itemTotal = itemSubtotal.add(itemVat);

        subtotal = subtotal.add(itemSubtotal);
        vatAmount = vatAmount.add(itemVat);

        return {
          ...item,
          total: itemTotal,
        };
      });

      const total = subtotal.add(vatAmount);

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.total = total;
      updateData.items = {
        create: items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount || 0,
          total: item.total,
        })),
      };
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        client: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async getStats(userId: string) {
    const [total, paid, unpaid, overdue] = await Promise.all([
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
    ]);

    const totalAmount = await this.prisma.invoice.aggregate({
      where: { userId },
      _sum: { total: true },
    });

    const paidAmount = await this.prisma.invoice.aggregate({
      where: { userId, status: 'paid' },
      _sum: { paidAmount: true },
    });

    const unpaidAmount = await this.prisma.invoice.aggregate({
      where: { userId, status: 'unpaid' },
      _sum: { total: true },
    });

    return {
      total,
      paid,
      unpaid,
      overdue,
      totalAmount: totalAmount._sum.total || 0,
      paidAmount: paidAmount._sum.paidAmount || 0,
      unpaidAmount: unpaidAmount._sum.total || 0,
    };
  }
}
