import React from 'react';

export const metadata = {
  title: "Terms of Service | ClashofCardio",
  description: "Legal regulations, workout disclaimers, billing rules, and service guidelines of the ClashofCardio fitness platform.",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8', color: '#ffffff', fontFamily: 'var(--font-body)', background: '#050508' }}>
      
      {/* Title */}
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '15px', textAlign: 'center', color: '#39ff14', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
        TERMS OF <span style={{ color: '#ffffff' }}>SERVICE</span>
      </h1>
      
      <p style={{ marginBottom: '45px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>Last Updated: May 20, 2026</p>

      {/* Medical Warning Box */}
      <div style={{ 
        background: 'rgba(255, 68, 68, 0.03)', 
        border: '1px solid rgba(255, 68, 68, 0.25)', 
        borderRadius: '16px', 
        padding: '25px', 
        marginBottom: '40px',
        boxShadow: '0 0 20px rgba(255, 68, 68, 0.05)'
      }}>
        <h3 style={{ color: '#ff4444', fontSize: '16px', fontWeight: 900, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ IMPORTANT MEDICAL DISCLAIMER
        </h3>
        <p style={{ opacity: 0.9, fontSize: '14px', margin: 0, fontWeight: 500, lineHeight: '1.6' }}>
          ClashofCardio provides general fitness tracking software. Our interactive workouts are intended purely for cardiovascular wellness and entertainment. <strong>This is NOT medical advice.</strong> Consult with a primary care physician or professional medical expert before starting any highly strenuous physical workout routine, especially if you have pre-existing cardiovascular conditions, joint discomfort, or structural constraints.
        </p>
      </div>

      {/* Sections */}
      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>1. Assumption of Risk & Liability</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '12px' }}>
          By accessing and playing our motion-controlled cardio workouts, you explicitly agree that you do so <strong>at your own responsibility and risk.</strong>
        </p>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          ClashofCardio, its engineers, and merchants assume no liability or responsibility for physical injuries, joint strain, dehydration, muscle pulls, fatigue, or device/accessory drops that occur while executing movements (like squats, jacks, or sprints) in front of the camera tracker.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>2. Age Restrictions</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          To create a registered user account and access workouts on ClashofCardio, you must be at least <strong>13 years of age</strong>. If you are under 18 years of age, you may only access the fitness challenges under the direct supervision of a parent or legal guardian who agrees to be bound by these terms.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>3. Subscriptions & Billing Rules</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '12px' }}>
          Access to certain workout tiers, custom football themes, stadiums, and unlimited daily game sessions requires a valid Premium Subscription.
        </p>
        <ul style={{ paddingLeft: '20px', opacity: 0.8, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <li>All subscription payments are securely managed via Razorpay on a recurring or one-off prepaid basis.</li>
          <li>Prices are subject to modifications. We will communicate any pricing changes at least 30 days prior to renewal.</li>
        </ul>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          Details regarding refunds and cancellations are explicitly governed by our separate <a href="/refund" style={{ color: '#39ff14', textDecoration: 'none', fontWeight: 600 }}>Refund & Cancellation Policy</a>.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>4. Account Termination</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          We reserve the right, without warning, to suspend or terminate user accounts if we detect terms violations, fraudulent billing practices, systematic attempts to inject false data into the global leaderboards, or harassment of other players in our competitive fitness suites.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>5. Governing Law</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          These Terms of Service shall be governed by, interpreted, and construed in accordance with the laws of India, under the exclusive jurisdiction of the judicial courts in Kochi, Kerala.
        </p>
      </section>

      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <a href="/" style={{
          textDecoration: 'none',
          color: '#000',
          background: '#39ff14',
          padding: '12px 35px',
          borderRadius: '30px',
          fontWeight: 800,
          fontFamily: 'var(--font-gaming)',
          boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)',
          display: 'inline-block'
        }}>BACK TO HOME</a>
      </div>
    </div>
  );
}
