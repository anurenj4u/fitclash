import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#0a0a0a',
      padding: '60px 5% 30px',
      borderTop: '1px solid var(--glass-border)',
      color: '#fff',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>
        <div>
          <div className="arcade-text" style={{ fontSize: '20px', marginBottom: '20px' }}>
            FIT<span style={{ color: 'var(--accent)' }}>CLASH</span>
          </div>
          <p style={{ opacity: 0.6, fontSize: '14px', lineHeight: 1.6 }}>
            The ultimate AI fitness experience. Turn your daily workout into an epic game.
          </p>
        </div>
        
        <div>
          <h4 style={{ marginBottom: '20px', fontSize: '16px' }}>COMPANY</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}><Link href="/about" style={{ color: '#fff', opacity: 0.6, textDecoration: 'none', fontSize: '14px' }}>About Us</Link></li>
            <li style={{ marginBottom: '10px' }}><Link href="/contact" style={{ color: '#fff', opacity: 0.6, textDecoration: 'none', fontSize: '14px' }}>Contact</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 style={{ marginBottom: '20px', fontSize: '16px' }}>LEGAL</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}><Link href="/privacy" style={{ color: '#fff', opacity: 0.6, textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</Link></li>
            <li style={{ marginBottom: '10px' }}><Link href="/terms" style={{ color: '#fff', opacity: 0.6, textDecoration: 'none', fontSize: '14px' }}>Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: '30px',
        textAlign: 'center',
        opacity: 0.4,
        fontSize: '12px'
      }}>
        © {new Date().getFullYear()} ClashofCardio AI Fitness. All rights reserved.
      </div>
    </footer>
  );
}
