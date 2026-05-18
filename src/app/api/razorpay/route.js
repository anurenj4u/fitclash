import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req) {
  try {
    const { amount, planId } = await req.json();

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_S1FS7OBodNnrsO',
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: parseInt(amount) * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: planId
      }
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
