import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { db } from '@/utils/corsair';
import { userSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planName) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
    }

    // Verify payment signature
    const signatureData = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signatureData)
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature;

    if (!isVerified) {
      console.error('Invalid payment signature computed');
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Set prices for DB record
    const priceMap: Record<string, string> = {
      Professional: '₹1,499',
      Business: '₹2,999',
    };
    const priceStr = priceMap[planName] || '0';

    // Update/insert user subscription details in DB
    const [existing] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    const cycleEndDate = new Date();
    cycleEndDate.setDate(cycleEndDate.getDate() + 30); // 30-day billing cycle

    if (existing) {
      await db
        .update(userSubscriptions)
        .set({
          planName,
          status: 'active',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySubscriptionId: razorpay_order_id,
          price: priceStr,
          startDate: new Date(),
          endDate: cycleEndDate,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, userId));
    } else {
      await db.insert(userSubscriptions).values({
        userId,
        planName,
        status: 'active',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySubscriptionId: razorpay_order_id,
        price: priceStr,
        startDate: new Date(),
        endDate: cycleEndDate,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to the ${planName} plan!`,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
