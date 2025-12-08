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
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderTimelineDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Post('from-offer/:offerId')
  convertOfferToOrder(@Request() req, @Param('offerId') offerId: string) {
    return this.ordersService.convertOfferToOrder(req.user.userId, offerId);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.ordersService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(req.user.userId, id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.ordersService.remove(req.user.userId, id);
  }

  @Post(':id/timeline')
  addTimelineEvent(
    @Request() req,
    @Param('id') id: string,
    @Body() timelineDto: CreateOrderTimelineDto
  ) {
    return this.ordersService.addTimelineEvent(req.user.userId, id, timelineDto);
  }
}
