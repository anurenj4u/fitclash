import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

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
      
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link href="/about" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>ABOUT</Link>
        <Link href="/contact" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>CONTACT</Link>
        
        {user ? (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 800 }}>{user.displayName?.toUpperCase() || 'PLAYER'}</span>
            <button 
              onClick={logout}
              style={{
                background: 'transparent',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '6px 15px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link href="/login" style={{ 
              color: '#fff', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: 700,
              padding: '8px 20px',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px'
            }}>LOGIN</Link>
            <Link href="/register" style={{ 
              color: '#000', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: 700,
              background: 'var(--accent)',
              padding: '8px 20px',
              borderRadius: '10px'
            }}>REGISTER</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
