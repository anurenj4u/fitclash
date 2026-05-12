import React from 'react';

export const metadata = {
  title: "Contact Us | FitClash",
  description: "Get in touch with the FitClash team for support or feedback.",
};

export default function ContactPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '40px' }}>
        GET IN <span style={{ color: 'var(--accent)' }}>TOUCH</span>
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '40px', opacity: 0.8 }}>
        Have questions, feedback, or need help with the AI tracking? We're here for you.
      </p>
      
      <div style={{ 
        background: 'var(--glass)', 
        padding: '40px', 
        borderRadius: '24px', 
        border: '1px solid var(--glass-border)',
        display: 'inline-block',
        minWidth: '300px'
      }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '10px' }}>Email Us</h3>
        <a href="mailto:support@fitclash.ai" style={{ color: '#fff', fontSize: '24px', fontWeight: 700, textDecoration: 'none' }}>
          support@fitclash.ai
        </a>
      </div>

      <div style={{ marginTop: '60px', opacity: 0.6, fontSize: '14px' }}>
        <p>Response time: Usually within 24 hours</p>
      </div>
    </div>
  );
}
