"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Shield, Rocket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Script from 'next/script';

const plans = [
  {
    id: 'weekly',
    name: 'ELITE WEEKLY',
    price: '99',
    period: 'week',
    color: 'var(--secondary)',
    features: ['Unlimited Games', 'Ad-Free Experience', 'Premium Trail Effects', 'Weekly Leaderboards']
  },
  {
    id: 'monthly',
    name: 'CHAMPION MONTHLY',
    price: '299',
    period: 'month',
    color: 'var(--accent)',
    isPopular: true,
    features: ['Unlimited Games', 'Custom Avatar Skins', 'Detailed Analytics', 'Priority Support', 'Exclusive Tournament Access']
  },
  {
    id: 'yearly',
    name: 'LEGEND YEARLY',
    price: '1999',
    period: 'year',
    color: 'var(--tertiary)',
    features: ['Unlimited Games', 'All Pro Features', 'Early Access to New Modes', 'Legacy Badge', 'Save 45% Yearly']
  }
];

export default function PremiumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscription = async (plan) => {
    if (!user) {
      router.push('/login?redirect=/premium');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, planId: plan.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_SqmNNvCUkjt0pW',
        amount: data.amount,
        currency: "INR",
        name: "ClashofCardio",
        description: `${plan.name} Subscription`,
        order_id: data.id,
        handler: function (response) {
          // In production, verify this on server!
          alert("Payment Successful! Your account will be upgraded shortly.");
          router.push('/?status=success');
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#39ff14",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
      } else {
        alert("Razorpay SDK not loaded. Please check your internet connection and try again.");
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert(`Error: ${error.message}. Please ensure the environment variables (NEXT_PUBLIC_RAZORPAY_KEY_ID) are set in Vercel.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#020205', minHeight: '100vh', color: '#fff' }}>
      <Navbar />
      
      <section style={{ padding: '120px 5% 80px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(57, 255, 20, 0.1)', padding: '10px 25px', borderRadius: '50px', marginBottom: '30px', border: '1px solid var(--accent)' }}>
            <Crown size={16} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: 'var(--accent)' }}>UNLOCK FULL POTENTIAL</span>
          </div>
          <h1 className="arcade-text" style={{ fontSize: 'clamp(32px, 5vw, 64px)', marginBottom: '20px' }}>UPGRADE TO <span style={{ color: 'var(--accent)' }}>PREMIUM</span></h1>
          <p style={{ opacity: 0.6, maxWidth: '600px', margin: '0 auto 60px' }}>Free users are limited to 15 games per day. Subscribe now for unlimited access and exclusive pro features.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{
                padding: '50px 40px',
                position: 'relative',
                border: plan.isPopular ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.1)',
                transform: plan.isPopular ? 'scale(1.05)' : 'scale(1)',
                zIndex: plan.isPopular ? 10 : 1
              }}
            >
              {plan.isPopular && (
                <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#000', padding: '5px 15px', borderRadius: '50px', fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>
                  MOST POPULAR
                </div>
              )}
              
              <h3 className="hud-text" style={{ color: plan.color, marginBottom: '20px' }}>{plan.name}</h3>
              <div style={{ marginBottom: '30px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900 }}>₹{plan.price}</span>
                <span style={{ opacity: 0.5 }}>/{plan.period}</span>
              </div>

              <div style={{ textAlign: 'left', marginBottom: '40px' }}>
                {plan.features.map((feature, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', fontSize: '14px', opacity: 0.8 }}>
                    <Check size={16} color={plan.color} /> {feature}
                  </div>
                ))}
              </div>

              <button
                disabled={loading}
                onClick={() => handleSubscription(plan)}
                className={plan.isPopular ? "glow-btn" : "glass-card"}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: plan.isPopular ? 'var(--accent)' : 'transparent',
                  color: plan.isPopular ? '#000' : '#fff',
                  border: plan.isPopular ? 'none' : '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {loading ? 'PROCESSING...' : 'GET STARTED'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 5%', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          {[
            { icon: Shield, title: 'Secure Payments', desc: 'Protected by Razorpay 256-bit encryption' },
            { icon: Zap, title: 'Instant Activation', desc: 'Get your pro features immediately' },
            { icon: Rocket, title: 'Level Up', desc: 'Join the top 1% of the fit community' }
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><item.icon size={32} color="var(--accent)" /></div>
              <h4 style={{ marginBottom: '10px' }}>{item.title}</h4>
              <p style={{ fontSize: '12px', opacity: 0.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
