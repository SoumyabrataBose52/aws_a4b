"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { creators, analytics, system, youtube } from "@/lib/api";
import {
  Users, TrendingUp, AlertCircle, ArrowRight, Play,
  MessageCircle, Activity, Flame, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { GradientText } from "@/components/ui/reactbits/gradient-text";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveGrid, ResponsiveStack } from "@/components/ui/responsive-grid";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [creatorList, setCreatorList] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [h, cl] = await Promise.all([system.health(), creators.list()]);
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
      <div className="animate-fade-in flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-lg lg:col-span-2" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex flex-col gap-6 max-w-7xl">
      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, <GradientText>Admin</GradientText>
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 cursor-default">
                    <span className={`w-2 h-2 rounded-full ${health?.status === "healthy" ? "bg-success animate-pulse-soft" : "bg-danger"}`} />
                    {health?.status === "healthy" ? "All systems operational" : "System degraded"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Backend: {health?.status || "Unknown"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-border">·</span>
            <span suppressHydrationWarning>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs">Export Report</Button>
          <Button size="sm" className="text-xs bg-accent-brand hover:bg-accent-brand/90 text-white">
            <Activity size={14} className="mr-1.5" /> Run Diagnostics
          </Button>
        </div>
      </div>

      {/* ── Metrics Row ─────────────────────────────────── */}
      <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap={16} className="stagger-children">
        <StatCard label="Total Creators" value={creatorList.length} icon={Users} delta={12} deltaLabel="vs last month" />
        <StatCard label="Content Pieces" value={stats?.total_content || 0} icon={Play} delta={8} deltaLabel="this week" />
        <StatCard label="Active Crises" value={stats?.active_crises || 0} icon={AlertCircle} delta={0} />
        <StatCard
          label="Avg. Sentiment"
          value={stats?.current_sentiment || 0}
          format={(v) => v.toFixed(1)}
          icon={MessageCircle}
          delta={5}
          deltaLabel="trending up"
        />
      </ResponsiveGrid>

      {/* -- Two-Column Section ──────────────────────────── */ }
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Creator Roster */}
    <Card className="lg:col-span-2 bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users size={14} className="text-accent-brand" /> Active Roster
          </CardTitle>
          <Link href="/dashboard/creators">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1">
              View All <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {creatorList.length === 0 ? (
          <EmptyState icon={Users} title="No creators yet" description="Add your first creator to get started with the AI management platform." actionLabel="Add Creator" actionHref="/dashboard/creators" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs">Creator</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Platforms</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatorList.slice(0, 5).map((c: any) => (
                <TableRow key={c.id} className="group border-border hover:bg-accent/50">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex gap-1">
                      {(c.platforms || []).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px] font-normal">
                          {p}
                        </Badge>
                      ))}
                      {(!c.platforms || c.platforms.length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className={`text-[10px] ${c.status === "active" ? "bg-success/15 text-success border-success/20 hover:bg-success/20" : ""}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${c.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/creators/${c.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity h-7">
                        Manage <ExternalLink size={10} className="ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* Trending Feed */}
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp size={14} className="text-warning" /> Trending Now
          </CardTitle>
          <Link href="/dashboard/trends">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1">
              See all <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {trending.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No trending data available.</div>
        ) : (
          <div className="divide-y divide-border">
            {trending.map((v: any, i: number) => (
              <div key={v.video_id} className="flex items-start gap-3 px-5 py-3 hover:bg-accent/30 transition-colors cursor-pointer group">
                <div className="shrink-0 mt-0.5">
                  {i < 3 ? (
                    <Flame size={16} className={i === 0 ? "text-danger" : i === 1 ? "text-warning" : "text-accent-brand"} />
                  ) : (
                    <span className="w-4 text-center text-xs font-mono text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-accent-brand transition-colors">
                    {v.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {v.channel_title} · {Number(v.views).toLocaleString()} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
    </div >
  );
}
