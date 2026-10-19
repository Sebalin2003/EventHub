import { Module } from '@nestjs/common';
import { PaymentsService, SoapClientService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { IdentityModule } from '../identity/identity.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Module({
  imports: [IdentityModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SoapClientService, JwtAuthGuard],
  exports: [PaymentsService]
})
export class PaymentsModule { }
