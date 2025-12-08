import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCompanyDto: CreateCompanyDto) {
    // Check if user already has a company
    const existingCompany = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (existingCompany) {
      throw new ConflictException('User already has a company profile');
    }

    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        userId,
      },
    });
  }

  async findByUserId(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    return company;
  }

  async update(userId: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findByUserId(userId);

    return this.prisma.company.update({
      where: { userId },
      data: updateCompanyDto,
    });
  }
}
