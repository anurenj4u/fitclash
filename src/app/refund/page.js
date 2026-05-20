import React from 'react';

export const metadata = {
  title: "Refund & Cancellation Policy | ClashofCardio",
  description: "Subscription refunds and cancellation timelines for ClashofCardio premium plans.",
};

export default function RefundPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8', color: '#ffffff', fontFamily: 'var(--font-body)', background: '#050508' }}>
      
      {/* Title */}
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '15px', textAlign: 'center', color: '#39ff14', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
        REFUND & <span style={{ color: '#ffffff' }}>CANCELLATION</span>
      </h1>
      
      <p style={{ marginBottom: '45px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>Last Updated: May 20, 2026</p>

      {/* Main Body */}
      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>1. Subscription Cancellations</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '15px' }}>
          You can cancel your ClashofCardio Premium subscription at any time. When you cancel, the cancellation will take effect at the end of your current billing cycle. You will continue to have full access to all Premium workout plans, custom stadiums, and unlimited daily workout sessions until the end of your prepaid period.
        </p>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          To cancel, go to your Profile page, click on "Manage Subscription", and select cancel, or send an email to <a href="mailto:clashofcardio@gmail.com" style={{ color: '#39ff14', textDecoration: 'none' }}>clashofcardio@gmail.com</a> from your registered email address.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>2. Refund Eligibility</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '15px' }}>
          Since ClashofCardio provides digital subscriptions that are instantly activated upon payment:
        </p>
        <ul style={{ paddingLeft: '20px', opacity: 0.8, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong>Digital Premium Subscriptions:</strong> These are generally non-refundable once activated, as you immediately gain full structural access to our proprietary computer-vision workout suite.
          </li>
          <li>
            <strong>Technical Defect Exceptions:</strong> If you experience severe, continuous technical issues with the application that prevent you from using your active subscription, please contact support. If we cannot resolve the issue within 7 business days, a pro-rata refund may be initiated at our sole discretion.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>3. Refund Timeline</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '15px' }}>
          Once a refund is approved by our billing team:
        </p>
        <ul style={{ paddingLeft: '20px', opacity: 0.8, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>Refunds will be processed back to the original payment source utilized during transaction initiation (via our secure payment processor Razorpay).</li>
          <li>The refund timeline typically ranges between <strong>5 to 7 business days</strong> to reflect in your banking statement, depending on your card issuer or banking system.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>4. Support Contact</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          For any billing disputes, refund requests, or subscription cancellation queries, please reach out directly to our merchant team:
          <br /><br />
          ✉️ Support Email: <a href="mailto:clashofcardio@gmail.com" style={{ color: '#39ff14', textDecoration: 'none', fontWeight: 700 }}>clashofcardio@gmail.com</a>
          <br />
          🏢 Business Entity: ClashofCardio Tech Services
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
