import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AresService } from './ares.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('integrations/ares')
@UseGuards(JwtAuthGuard)
export class AresController {
  constructor(private readonly aresService: AresService) {}

  @Get('company/:ico')
  getCompanyInfo(@Param('ico') ico: string) {
    return this.aresService.getCompanyInfo(ico);
  }

  @Get('validate/:ico')
  async validateICO(@Param('ico') ico: string) {
    const isValid = await this.aresService.validateICO(ico);
    return { ico, isValid };
  }
}
