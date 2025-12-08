import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch,
  UseGuards,
  Request
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Request() req, @Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(req.user.userId, createCompanyDto);
  }

  @Get('me')
  findMy(@Request() req) {
    return this.companiesService.findByUserId(req.user.userId);
  }

  @Patch('me')
  update(@Request() req, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(req.user.userId, updateCompanyDto);
  }
}
