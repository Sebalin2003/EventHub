import { Module } from '@nestjs/common';
import { PaymentsService, SoapClientService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SoapClientService],
  exports: [PaymentsService]
})
export class PaymentsModule { }
