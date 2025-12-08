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
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@Request() req, @Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(req.user.userId, createOfferDto);
  }

  @Get()
  findAll(@Request() req, @Query() query: any) {
    return this.offersService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.offersService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
    return this.offersService.update(req.user.userId, id, updateOfferDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.offersService.remove(req.user.userId, id);
  }
}
