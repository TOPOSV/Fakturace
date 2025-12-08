import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderTimelineDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: createOrderDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (createOrderDto.offerId) {
      const offer = await this.prisma.offer.findFirst({
        where: { id: createOrderDto.offerId, userId },
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }
    }

    // Generate order number
    const orderCount = await this.prisma.order.count();
    const orderNumber = `ZAK${String(orderCount + 1).padStart(6, '0')}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        clientId: createOrderDto.clientId,
        offerId: createOrderDto.offerId,
        name: createOrderDto.name,
        totalAmount: createOrderDto.totalAmount,
        timeline: {
          create: {
            event: 'created',
            description: 'Order created',
          },
        },
      },
      include: {
        client: true,
        offer: true,
        timeline: true,
      },
    });

    return order;
  }

  async findAll(userId: string, query?: any) {
    const where: any = { userId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.clientId) {
      where.clientId = query.clientId;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        offer: true,
        invoices: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        client: true,
        offer: {
          include: {
            items: true,
          },
        },
        invoices: true,
        timeline: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(userId: string, id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(userId, id);

    // Track status changes in timeline
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      await this.prisma.orderTimeline.create({
        data: {
          orderId: id,
          event: updateOrderDto.status,
          description: `Status changed to ${updateOrderDto.status}`,
        },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        client: true,
        timeline: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.order.delete({
      where: { id },
    });
  }

  async addTimelineEvent(userId: string, orderId: string, timelineDto: CreateOrderTimelineDto) {
    await this.findOne(userId, orderId);

    return this.prisma.orderTimeline.create({
      data: {
        orderId,
        event: timelineDto.event,
        description: timelineDto.description,
      },
    });
  }

  async convertOfferToOrder(userId: string, offerId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: { id: offerId, userId },
      include: {
        client: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status === 'rejected' || offer.status === 'expired') {
      throw new BadRequestException('Cannot convert rejected or expired offer to order');
    }

    const orderCount = await this.prisma.order.count();
    const orderNumber = `ZAK${String(orderCount + 1).padStart(6, '0')}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        clientId: offer.clientId,
        offerId: offer.id,
        name: `Order from offer ${offer.offerNumber}`,
        totalAmount: offer.total,
        timeline: {
          create: [
            {
              event: 'created',
              description: `Order created from offer ${offer.offerNumber}`,
            },
            {
              event: 'approved',
              description: 'Offer approved and converted to order',
            },
          ],
        },
      },
      include: {
        client: true,
        offer: true,
        timeline: true,
      },
    });

    // Update offer status
    await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: 'accepted' },
    });

    return order;
  }
}
