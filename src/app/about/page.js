import React from 'react';

export const metadata = {
  title: "About ClashofCardio | The Future of AI Fitness",
  description: "Learn how ClashofCardio uses computer vision and AI to gamify your fitness routine. No gym membership required, just your camera.",
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', lineHeight: '1.8' }}>
      <h1 className="arcade-text" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '40px', textAlign: 'center' }}>
        REDEFINING <span style={{ color: 'var(--accent)' }}>FITNESS</span>
      </h1>
      
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '20px' }}>Our Mission</h2>
        <p>
          At ClashofCardio, we believe that fitness should be fun, accessible, and engaging. Traditional workouts can often feel like a chore. We've combined cutting-edge AI motion tracking with arcade-style gameplay to create an experience that keeps you moving and coming back for more.
        </p>
      </section>

      <section style={{ marginBottom: '60px', padding: '30px', background: 'var(--glass)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '20px' }}>How AI Tracking Works</h2>
        <p>
          ClashofCardio uses <strong>TensorFlow.js</strong> and advanced pose estimation models to track your movements in real-time through your device's camera. 
          Our AI identifies key points on your body to verify each rep, ensuring perfect form and preventing "cheating." 
          <br /><br />
          <span style={{ opacity: 0.8, fontSize: '14px' }}>*No video data is ever sent to our servers. All processing happens locally on your device for total privacy.</span>
        </p>
      </section>

      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '20px' }}>Why Gamified Fitness?</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Instant Feedback:</strong> See your progress in real-time with on-screen boosts.</li>
          <li><strong>Engagement:</strong> Compete against yourself or the AI in high-energy races.</li>
          <li><strong>Convenience:</strong> Work out anywhere — your living room, office, or park.</li>
          <li><strong>Cost-Effective:</strong> No expensive sensors or equipment needed.</li>
        </ul>
      </section>
      
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/" className="glow-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>BACK TO GAME</a>
      </div>
    </div>
  );
}
