import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';
import { env } from '../../config/env.js';
import { formatResponse } from '../../utils/formatResponse.js';

export class PaymentController {
  static async handleXenditWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const callbackToken = req.headers['x-callback-token'];
      if (!callbackToken || callbackToken !== env.XENDIT_CALLBACK_TOKEN) {
        res.status(401).json({
          success: false,
          message: 'Invalid callback token',
          code: 'UNAUTHORIZED_CALLBACK',
          errors: [],
        });
        return;
      }

      // Process webhook
      try {
        await PaymentService.handleWebhook(req.body);
      } catch (err) {
        // Log error and continue always return 200 OK to Xendit
        // This prevents duplicate retries from Xendit
        console.error('❌ Error processing Xendit webhook internally:', err);
      }

      res.status(200).json(formatResponse('Webhook callback processed successfully'));
    } catch (error) {
      next(error);
    }
  }
}
