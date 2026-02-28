'use client';
import { useEffect, useState } from 'react';
import { creators, analytics, system, youtube } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [creatorList, setCreatorList] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [h, cl] = await Promise.all([
          system.health(),
          creators.list(),
        ]);
        setHealth(h);
        setCreatorList(cl);

        // Load dashboard for first creator
        if (cl.length > 0) {
          const dash = await analytics.dashboard(cl[0].id);
          setStats(dash);
        }

        // Load trending
        try {
          const t = await youtube.trending('IN', 5);
          setTrending(t.videos || []);
        } catch { }
      } catch (e: any) {
        console.error('Dashboard load error:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Command Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {health ? `Backend: ${health.status} • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'Connecting...'}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Creators</div>
          <div className="stat-value">{creatorList.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Content Pieces</div>
          <div className="stat-value">{stats?.total_content || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Crises</div>
          <div className="stat-value" style={stats?.active_crises > 0 ? { background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : undefined}>
            {stats?.active_crises || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sentiment Score</div>
          <div className="stat-value">{stats?.current_sentiment?.toFixed(1) || '—'}</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Creators */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Creators</h2>
            <a href="/creators" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
          </div>
          {creatorList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
              <p>No creators yet</p>
              <a href="/creators" className="btn-glow" style={{ display: 'inline-block', marginTop: '12px', textDecoration: 'none' }}>
                Add Creator
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {creatorList.slice(0, 5).map((c: any) => (
                <a key={c.id} href={`/creators/${c.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px', borderRadius: '10px', textDecoration: 'none', color: 'inherit',
                  background: 'var(--bg-secondary)', transition: 'all 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, color: '#fff',
                  }}>
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {c.platforms?.join(', ') || 'No platforms'}
                    </div>
                  </div>
                  <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                    {c.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Trending India */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>🔥 Trending in India</h2>
            <a href="/trends" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>See trends →</a>
          </div>
          {trending.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No trending data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trending.map((v: any, i: number) => (
                <div key={v.video_id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px', borderRadius: '10px', background: 'var(--bg-secondary)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '8px',
                    background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {v.channel_title} • {Number(v.views).toLocaleString()} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
