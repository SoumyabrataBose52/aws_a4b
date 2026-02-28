'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', icon: '⚡', label: 'Dashboard' },
  { href: '/creators', icon: '👤', label: 'Creators' },
  { href: '/content', icon: '✏️', label: 'Content' },
  { href: '/trends', icon: '📈', label: 'Trends' },
  { href: '/crisis', icon: '🛡️', label: 'Crisis' },
  { href: '/deals', icon: '🤝', label: 'Deals' },
  { href: '/analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav style={{
      width: '220px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: '22px',
        fontWeight: 800,
        background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
        letterSpacing: '-0.5px',
      }}>
        NEXUS SOLO
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '32px', letterSpacing: '1px' }}>
        AI COMMAND CENTER
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', padding: '14px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>LLM Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Connected</span>
        </div>
      </div>
    </nav>
  );
}
