import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOfferDto: CreateOfferDto) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new BadRequestException('Company profile must be created first');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: createOfferDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Calculate totals
    let subtotal = new Decimal(0);
    let vatAmount = new Decimal(0);

    const items = createOfferDto.items.map(item => {
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

    // Generate offer number
    const offerNumber = `${company.offerPrefix}${String(company.nextOfferNum).padStart(6, '0')}`;

    // Calculate valid until date if not provided (default 30 days)
    const issueDate = new Date();
    const validUntil = createOfferDto.validUntil 
      ? new Date(createOfferDto.validUntil)
      : new Date(issueDate.getTime() + (30 * 24 * 60 * 60 * 1000));

    const offer = await this.prisma.offer.create({
      data: {
        offerNumber,
        userId,
        companyId: company.id,
        clientId: createOfferDto.clientId,
        issueDate,
        validUntil,
        subtotal,
        vatAmount,
        total,
        notes: createOfferDto.notes,
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

    // Update company's next offer number
    await this.prisma.company.update({
      where: { id: company.id },
      data: { nextOfferNum: company.nextOfferNum + 1 },
    });

    return offer;
  }

  async findAll(userId: string, query?: any) {
    const where: any = { userId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.clientId) {
      where.clientId = query.clientId;
    }

    return this.prisma.offer.findMany({
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
    const offer = await this.prisma.offer.findFirst({
      where: { id, userId },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async update(userId: string, id: string, updateOfferDto: UpdateOfferDto) {
    await this.findOne(userId, id);

    const updateData: any = {};

    if (updateOfferDto.status) {
      updateData.status = updateOfferDto.status;
    }

    if (updateOfferDto.validUntil) {
      updateData.validUntil = new Date(updateOfferDto.validUntil);
    }

    if (updateOfferDto.notes !== undefined) {
      updateData.notes = updateOfferDto.notes;
    }

    if (updateOfferDto.items) {
      await this.prisma.offerItem.deleteMany({
        where: { offerId: id },
      });

      let subtotal = new Decimal(0);
      let vatAmount = new Decimal(0);

      const items = updateOfferDto.items.map(item => {
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

    return this.prisma.offer.update({
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
    return this.prisma.offer.delete({
      where: { id },
    });
  }
}
