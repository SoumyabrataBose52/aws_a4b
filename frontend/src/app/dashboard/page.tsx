'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { creators, analytics, system, youtube } from '@/lib/api';
import { Users, TrendingUp, Flame, ArrowRight } from 'lucide-react';

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

        if (cl.length > 0) {
          const dash = await analytics.dashboard(cl[0].id);
          setStats(dash);
        }

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold mb-1">Command Center</h1>
        <p className="text-text-secondary text-sm">
          {health ? `Backend: ${health.status} • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'Connecting...'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
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
          <div className="stat-value">{stats?.active_crises || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sentiment Score</div>
          <div className="stat-value">{stats?.current_sentiment?.toFixed(1) || '—'}</div>
        </div>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-2 gap-5">
        {/* Creators */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Users size={16} className="text-accent" />
              Creators
            </h2>
            <Link href="/dashboard/creators" className="text-[13px] text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {creatorList.length === 0 ? (
            <div className="text-center py-10 text-text-secondary">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No creators yet</p>
              <Link href="/dashboard/creators" className="btn-glow inline-block mt-3 no-underline">
                Add Creator
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {creatorList.slice(0, 5).map((c: any) => (
                <Link key={c.id} href={`/dashboard/creators/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-[10px] no-underline text-inherit bg-bg-secondary hover:bg-bg-card-hover transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-text-secondary truncate">{c.platforms?.join(', ') || 'No platforms'}</div>
                  </div>
                  <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Trending India */}
        <div className="glass-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Flame size={16} className="text-warning" />
              Trending in India
            </h2>
            <Link href="/dashboard/trends" className="text-[13px] text-accent hover:underline flex items-center gap-1">
              See trends <ArrowRight size={12} />
            </Link>
          </div>
          {trending.length === 0 ? (
            <p className="text-text-secondary text-center py-10">No trending data</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {trending.map((v: any, i: number) => (
                <div key={v.video_id} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-bg-secondary">
                  <div className="w-7 h-7 rounded-lg bg-bg-card flex items-center justify-center text-xs font-bold text-accent shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px] truncate">{v.title}</div>
                    <div className="text-[11px] text-text-secondary">
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
