import React from 'react';

export const metadata = {
  title: "Privacy Policy | ClashofCardio AI Fitness",
  description: "Transparency about how we handle your camera data, user accounts, and local motion tracking at ClashofCardio.",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8', color: '#ffffff', fontFamily: 'var(--font-body)', background: '#050508' }}>
      
      {/* Title */}
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '15px', textAlign: 'center', color: '#39ff14', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
        PRIVACY <span style={{ color: '#ffffff' }}>POLICY</span>
      </h1>
      
      <p style={{ marginBottom: '45px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>Last Updated: May 20, 2026</p>

      {/* Camera Highlight Box */}
      <div style={{ 
        background: 'rgba(57, 255, 20, 0.03)', 
        border: '1px solid rgba(57, 255, 20, 0.25)', 
        borderRadius: '16px', 
        padding: '25px', 
        marginBottom: '40px',
        boxShadow: '0 0 20px rgba(57, 255, 20, 0.05)'
      }}>
        <h3 style={{ color: '#39ff14', fontSize: '16px', fontWeight: 900, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📷 WEBCAM & PRIVACY ASSURANCE
        </h3>
        <p style={{ opacity: 0.9, fontSize: '14px', margin: 0, fontWeight: 500, lineHeight: '1.6' }}>
          <strong>“Camera processing happens locally and video is not stored.”</strong> We value your trust above all. The webcam stream is parsed completely in local volatile RAM on your browser using TensorFlow.js model weights to track skeleton pose indicators. Not a single pixel is ever uploaded to external servers, processed outside your machine, or stored on disc.
        </p>
      </div>

      {/* Policy Details */}
      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>1. Data We Collect</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '15px' }}>
          To deliver a robust gamified workout suite, we process and store the following structural datasets:
        </p>
        <ul style={{ paddingLeft: '20px', opacity: 0.8, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li><strong>User Profile Credentials:</strong> Your registered email, display name, password hashes, and system auth indicators to guarantee account safety.</li>
          <li><strong>Fitness Progression Stats:</strong> Burned calories count, XP milestones, active level tier, streaks, unlocked characters/themes, and overall finished reps count to render the user dashboards.</li>
          <li><strong>Transaction Metadata:</strong> Order details, active subscription periods, and Razorpay payment token signatures to authorize premium tier privileges.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>2. How Camera Data is Utilized</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '12px' }}>
          We use browser-based local pose-estimation tracking (via your webcam feed) for the sole purpose of confirming and adding exercise reps in real-time.
        </p>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          You retain complete autonomy over camera authorization permissions, which can be toggled on/off instantly inside your native browser preference settings at any moment.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>3. Secure Payments Processing</h2>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '12px' }}>
          All premium workout subscription transactions are handled via <strong>Razorpay</strong>, which utilizes industry-leading TLS/AES-256 standard encryption mechanisms.
        </p>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          ClashofCardio never accesses, processes, or logs highly sensitive parameters like credit card details, CVV digits, or online banking passwords on its database tables.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>4. Analytics & Cookies</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          We utilize standard diagnostic cookies (Google Analytics, Clarity) to log aggregated, non-identifying telemetry (e.g., page load speeds, active workout type ratios) to improve game performance and balance training metrics.
        </p>
      </section>

      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '30px' }}>
        <h2 style={{ color: '#39ff14', fontSize: '18px', marginBottom: '15px', fontWeight: 800 }}>5. Contact Information</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>
          If you have any questions, feedback, or data deletion requests, please contact our merchant support team at:
          <br /><br />
          ✉️ Email: <a href="mailto:clashofcardio@gmail.com" style={{ color: '#39ff14', textDecoration: 'none', fontWeight: 700 }}>clashofcardio@gmail.com</a>
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
