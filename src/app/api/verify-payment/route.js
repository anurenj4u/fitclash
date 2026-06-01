import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { adminDb, adminAuth } = getFirebaseAdmin();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      idToken,      // Firebase ID token from client
      planId,
    } = await req.json();

    // 1. Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed: invalid signature' },
        { status: 400 }
      );
    }

    // 2. Verify Firebase ID token to get the real UID (cannot be spoofed)
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 3. Update Firestore using Admin SDK (bypasses all security rules)
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.set(
      {
        isPremium: true,
        premiumPlan: planId,
        premiumActivatedAt: new Date().toISOString(),
        premiumPaymentId: razorpay_payment_id,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
