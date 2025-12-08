import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll(query?: any) {
    const where: any = {};

    if (query?.type) {
      where.type = query.type;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { ico: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        offers: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne(id);

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if client has invoices
    const invoiceCount = await this.prisma.invoice.count({
      where: { clientId: id },
    });

    if (invoiceCount > 0) {
      throw new Error('Cannot delete client with existing invoices');
    }

    return this.prisma.client.delete({
      where: { id },
    });
  }

  async getHistory(id: string) {
    await this.findOne(id);

    const [invoices, offers, orders] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.offer.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      invoices,
      offers,
      orders,
    };
  }
}
