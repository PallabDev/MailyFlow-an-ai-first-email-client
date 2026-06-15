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

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
    }

    // 1. Verify payment signature locally
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

    // 2. Prevent payment replays (ensure payment ID is unique in DB)
    const [existingPayment] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.razorpayPaymentId, razorpay_payment_id));

    if (existingPayment) {
      return NextResponse.json({ error: 'Payment has already been processed' }, { status: 400 });
    }

    // 3. Fetch order details from Razorpay to verify user ID and plan name
    const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
    const razorpayRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!razorpayRes.ok) {
      const errText = await razorpayRes.text();
      console.error('Failed to retrieve order from Razorpay API:', errText);
      return NextResponse.json({ error: 'Failed to verify order details with payment gateway' }, { status: 400 });
    }

    const order = await razorpayRes.json();
    
    // Verify user ownership of the order
    if (order.notes?.userId !== userId) {
      return NextResponse.json({ error: 'Payment verification failed: User ID mismatch' }, { status: 400 });
    }

    // Verify order matches plan name requested
    if (order.notes?.planName !== planName) {
      return NextResponse.json({ error: 'Payment verification failed: Plan name mismatch' }, { status: 400 });
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
