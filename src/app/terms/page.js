import React from 'react';

export const metadata = {
  title: "Terms of Service | ClashofCardio",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8' }}>
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>
        TERMS OF <span style={{ color: 'var(--accent)' }}>SERVICE</span>
      </h1>
      <p>By using ClashofCardio, you agree to these terms...</p>
      <section style={{ marginTop: '20px' }}>
        <h2 style={{ color: 'var(--accent)' }}>Medical Disclaimer</h2>
        <p>
          Consult with a healthcare professional before starting any new exercise program. ClashofCardio is for entertainment purposes and is used at your own risk.
        </p>
      </section>
    </div>
  );
}
