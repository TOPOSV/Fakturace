import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Request() req) {
    return this.dashboardService.getOverview(req.user.userId);
  }

  @Get('revenue/monthly')
  getMonthlyRevenue(@Request() req, @Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.dashboardService.getMonthlyRevenue(req.user.userId, yearNum);
  }

  @Get('clients/top')
  getTopClients(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getTopClients(req.user.userId, limitNum);
  }

  @Get('invoices/overdue')
  getOverdueInvoices(@Request() req) {
    return this.dashboardService.getOverdueInvoices(req.user.userId);
  }

  @Get('activity/recent')
  getRecentActivity(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getRecentActivity(req.user.userId, limitNum);
  }
}
