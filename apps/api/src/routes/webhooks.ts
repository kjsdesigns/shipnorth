import { Router } from 'express';
import { raw } from 'express';

const router = Router();

// Stripe webhook
router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  // TODO: Verify webhook signature
  // TODO: Process webhook event
  res.json({ received: true });
});

// ShipStation webhook
router.post('/shipstation', async (req, res) => {
  // TODO: Process tracking updates
  res.json({ received: true });
});

export default router;