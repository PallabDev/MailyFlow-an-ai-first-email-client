import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { db } from '@/utils/corsair';
import { userSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

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

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const actualBuffer = Buffer.from(razorpay_signature, 'utf-8');

    const isVerified = expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);

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
      Professional: '₹599',
      Business: '₹999',
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

    // 4. Fetch user details and send confirmation email via Resend
    try {
      const user = await currentUser();
      const userEmail = user?.emailAddresses[0]?.emailAddress;

      if (userEmail && process.env.RESEND_API_KEY) {
        const from = process.env.RESEND_FROM || 'HexFrom <no-reply@luqe.in>';
        const resend = new Resend(process.env.RESEND_API_KEY.replace(/['"]/g, ''));
        
        const { data, error: emailError } = await resend.emails.send({
          from: from.replace(/['"]/g, ''),
          to: [userEmail],
          subject: `Welcome to MailyFlow ${planName}!`,
          html: `
            <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8faf7; padding: 40px 20px; color: #2c2c2a; line-height: 1.6;">
              <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid rgba(17, 24, 39, 0.08); border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="font-size: 24px; font-weight: 700; color: #5f7a68; margin: 0; letter-spacing: -0.5px;">MailyFlow</h2>
                  <p style="font-size: 12px; color: #8d9590; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Your AI Email Employee</p>
                </div>
                
                <!-- Title -->
                <h1 style="font-size: 20px; font-weight: 600; color: #2c302d; margin-top: 0; margin-bottom: 15px; text-align: center;">Subscription Confirmed!</h1>
                
                <p style="font-size: 14px; color: #5e635f; margin-bottom: 25px; text-align: center;">
                  Thank you for upgrading! Your workspace has been successfully upgraded to the <strong>${planName} Plan</strong>.
                </p>
                
                <!-- Plan Details Box -->
                <div style="background-color: #f4f7f4; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #ccd2cd;">
                  <h3 style="font-size: 12px; font-weight: 700; color: #5f7a68; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Subscription Details</h3>
                  <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #8d9590; font-weight: 500;">Plan Type:</td>
                      <td style="padding: 6px 0; text-align: right; color: #2c302d; font-weight: 600;">${planName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #8d9590; font-weight: 500;">Price:</td>
                      <td style="padding: 6px 0; text-align: right; color: #2c302d; font-weight: 600;">${priceStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #8d9590; font-weight: 500;">Status:</td>
                      <td style="padding: 6px 0; text-align: right; color: #6e9b7e; font-weight: 600;">Active</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Call to Action -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="https://mailyflow.in/dashboard" style="display: inline-block; background-color: #5f7a68; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background-color 0.2s;">
                    Go to Dashboard
                  </a>
                </div>
                
                <!-- Footer info -->
                <div style="border-top: 1px solid rgba(17, 24, 39, 0.08); padding-top: 20px; text-align: center; font-size: 12px; color: #8d9590;">
                  <p style="margin: 0;">If you have any questions or billing issues, feel free to reply to this email or contact support at <a href="mailto:support@mailyflow.in" style="color: #5f7a68; text-decoration: underline;">support@mailyflow.in</a>.</p>
                </div>
              </div>
            </div>
          `
        });

        if (emailError) {
          console.error('Failed to send Resend confirmation email:', emailError);
        } else {
          console.log(`Resend confirmation email sent to ${userEmail} successfully. Msg ID: ${data?.id}`);
        }
      } else {
        console.warn('Skipping Resend email: userEmail or RESEND_API_KEY is not defined', { userEmail, hasKey: !!process.env.RESEND_API_KEY });
      }
    } catch (emailErr) {
      console.error('Error occurred while sending Resend confirmation email:', emailErr);
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
