import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Request() req, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.userId, createInvoiceDto);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.invoicesService.findAll(req.user.userId, query);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.invoicesService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoicesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(req.user.userId, id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.invoicesService.remove(req.user.userId, id);
  }
}
