"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { creators, analytics, system, youtube } from "@/lib/api";
import { Users, TrendingUp, Flame, ArrowRight, Activity, Zap, PlaySquare } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/premium/animated-number";
import { BentoGrid, BentoGridItem } from "@/components/ui/premium/bento-grid";
import { GlassPanel } from "@/components/ui/premium/glass-panel";

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
          const t = await youtube.trending("IN", 5);
          setTrending(t.videos || []);
        } catch { }
      } catch (e: any) {
        console.error("Dashboard load error:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-accent-brand animate-spin" />
          <div className="absolute inset-2 rounded-full border-r-2 border-[#00d2d3] animate-spin-reverse" />
        </div>
        <p className="text-text-secondary text-sm animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-1 tracking-tight">Overview</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              {health ? health.status : "Offline"}
            </span>
            <span>•</span>
            <span suppressHydrationWarning>{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel gradient className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Users size={16} className="text-accent-brand" />
            <span className="text-sm font-medium">Total Creators</span>
          </div>
          <div className="text-3xl font-bold">
            <AnimatedNumber value={creatorList.length} />
          </div>
        </GlassPanel>

        <GlassPanel gradient className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <PlaySquare size={16} className="text-success" />
            <span className="text-sm font-medium">Content Pieces</span>
          </div>
          <div className="text-3xl font-bold">
            <AnimatedNumber value={stats?.total_content || 0} />
          </div>
        </GlassPanel>

        <GlassPanel gradient className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Activity size={16} className="text-danger" />
            <span className="text-sm font-medium">Active Crises</span>
          </div>
          <div className="text-3xl font-bold text-danger">
            <AnimatedNumber value={stats?.active_crises || 0} />
          </div>
        </GlassPanel>

        <GlassPanel gradient className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Zap size={16} className="text-warning" />
            <span className="text-sm font-medium">Avg Sentiment</span>
          </div>
          <div className="text-3xl font-bold">
            {stats?.current_sentiment ? (
              <AnimatedNumber
                value={stats.current_sentiment}
                format={(v) => v.toFixed(1)}
              />
            ) : "—"}
          </div>
        </GlassPanel>
      </div>

      {/* Bento Grid Layout for Main Content */}
      <BentoGrid className="md:auto-rows-[22rem] mt-2">
        {/* Creators Bento Item */}
        <BentoGridItem
          className="md:col-span-2"
          title={<div className="text-lg font-bold flex items-center gap-2"><Users className="text-accent-brand size-5" /> Creator Roster</div>}
          description="Your active talent portfolio and their statuses."
          header={
            <div className="flex flex-col gap-3 h-full max-h-[14rem] overflow-y-auto pr-2 custom-scrollbar">
              {creatorList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-60">
                  <Users size={32} className="mb-2" />
                  <p>No creators onboarded</p>
                </div>
              ) : (
                creatorList.slice(0, 5).map((c: any) => (
                  <Link key={c.id} href={`/dashboard/creators/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-105 transition-transform">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[15px] truncate">{c.name}</div>
                      <div className="text-xs text-text-secondary truncate">{c.platforms?.join(', ') || 'No platforms'}</div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${c.status === 'active' ? 'bg-[#00d2d3]/10 text-[#00d2d3] border-[#00d2d3]/20' : 'bg-white/5 text-text-secondary border-white/10'}`}>
                      {c.status}
                    </div>
                  </Link>
                ))
              )}
            </div>
          }
        />

        {/* Trending Bento Item */}
        <BentoGridItem
          className="md:col-span-1"
          title={<div className="text-lg font-bold flex items-center gap-2"><Flame className="text-warning size-5" /> Trending Live</div>}
          description="Top YouTube content in India right now."
          header={
            <div className="flex flex-col gap-2.5 h-full max-h-[14rem] overflow-y-auto pr-2 custom-scrollbar">
              {trending.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-secondary opacity-60">
                  <p>Loading trends...</p>
                </div>
              ) : (
                trending.map((v: any, i: number) => (
                  <div key={v.video_id} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[11px] font-bold text-text-secondary shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] leading-snug line-clamp-2 mb-1 group-hover:text-accent-brand transition-colors">{v.title}</div>
                      <div className="text-[11px] text-text-secondary flex items-center justify-between">
                        <span className="truncate max-w-[100px]">{v.channel_title}</span>
                        <span className="text-white/40">•</span>
                        <span className="font-mono text-white/60">{Number(v.views).toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          }
        />
      </BentoGrid>
    </div>
  );
}
