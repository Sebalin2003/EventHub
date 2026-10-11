import { Module } from '@nestjs/common';
import { PaymentsService, SoapClientService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SoapClientService],
  exports: [PaymentsService]
})
export class PaymentsModule { }
