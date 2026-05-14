import React from 'react';

export const metadata = {
  title: "Privacy Policy | ClashofCardio AI Fitness",
  description: "Transparency about how we handle your camera data and motion tracking at ClashofCardio.",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8', opacity: 0.9 }}>
      <h1 className="arcade-text" style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>
        PRIVACY <span style={{ color: 'var(--accent)' }}>POLICY</span>
      </h1>
      
      <p style={{ marginBottom: '20px' }}>Last Updated: May 12, 2026</p>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '15px' }}>1. Camera Data & Motion Tracking</h2>
        <p>
          ClashofCardio uses your device's camera to enable motion tracking and exercise detection. 
          <strong> Crucially, all video processing is performed locally on your device using TensorFlow.js.</strong> 
          No images or video streams are ever transmitted to our servers or stored permanently on your device. 
          The camera feed is used only in memory to calculate body keypoints.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '15px' }}>2. Data Collection</h2>
        <p>
          We do not collect personally identifiable information (PII). We may use anonymous analytics (Google Analytics) to track:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>App usage duration</li>
          <li>Scores and game completion rates</li>
          <li>Device type and browser version</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '15px' }}>3. Third-Party Services</h2>
        <p>
          We use Google Analytics and Microsoft Clarity to improve our service. These services may collect information about your interaction with the app.
        </p>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '20px', marginBottom: '15px' }}>4. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at support@clashofcardio.fit.
        </p>
      </section>
    </div>
  );
}
