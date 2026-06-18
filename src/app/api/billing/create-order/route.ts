import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { planName } = await req.json();
    if (!planName || (planName !== 'Professional' && planName !== 'Business')) {
      return NextResponse.json({ error: 'Invalid plan selection' }, { status: 400 });
    }

    const priceMap: Record<string, number> = {
      Professional: 99900, // INR 999 in paise
      Business: 199900, // INR 1999 in paise
    };
    const amount = priceMap[planName];

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      logger.error('Razorpay credentials missing from env variables');
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
    }

    // Call Razorpay Order Creation API via standard fetch Basic Auth
    const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `receipt_${userId.slice(-8)}_${Date.now().toString().slice(-6)}`,
        notes: {
          userId,
          planName,
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errorData = await razorpayRes.text();
      logger.error('Razorpay Order Creation API Failed:', errorData);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    const order = await razorpayRes.json();
    return NextResponse.json({
      success: true,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    logger.error('Error creating billing order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
