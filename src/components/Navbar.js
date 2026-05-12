import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'rgba(5, 5, 5, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 5%',
      zIndex: 100,
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div className="arcade-text" style={{ fontSize: '24px', cursor: 'pointer' }}>
          FIT<span style={{ color: 'var(--accent)' }}>CLASH</span>
        </div>
      </Link>
      
      <div style={{ display: 'flex', gap: '30px' }}>
        <Link href="/about" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>ABOUT</Link>
        <Link href="/contact" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>CONTACT</Link>
      </div>
    </nav>
  );
}
