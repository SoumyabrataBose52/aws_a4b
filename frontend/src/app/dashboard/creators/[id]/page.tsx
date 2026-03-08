"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { creators, youtube } from "@/lib/api";
import {
    ArrowLeft, Users, Eye, Play, Calendar, ExternalLink,
    RefreshCw, Globe, ThumbsUp, MessageCircle, TrendingUp,
    Sparkles, Clock, Hash, BarChart3, Youtube
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveGrid } from "@/components/ui/responsive-grid";
import { StatCard } from "@/components/ui/stat-card";

interface CreatorData {
    id: string;
    name: string;
    email?: string;
    bio?: string;
    status: string;
    platforms?: string[];
    avatar_url?: string;
    youtube_channel_id?: string;
    youtube_handle?: string;
    subscribers?: number;
    total_views?: number;
    video_count?: number;
    created_at: string;
    updated_at: string;
    dna?: any;
}

export default function CreatorStatsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [creator, setCreator] = useState<CreatorData | null>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [videosLoading, setVideosLoading] = useState(false);

    useEffect(() => {
        loadCreator();
    }, [id]);

    async function loadCreator() {
        setLoading(true);
        try {
            const c = await creators.get(id);
            setCreator(c);
            // If creator has a YouTube channel, load recent videos
            if (c.youtube_channel_id) {
                loadVideos(c.youtube_channel_id);
            }
        } catch (e) {
            console.error("Failed to load creator:", e);
        }
        setLoading(false);
    }

    async function loadVideos(channelId: string) {
        setVideosLoading(true);
        try {
            const res = await youtube.channelVideos(channelId);
            setVideos(res.videos || []);
        } catch (e: any) {
            // Gracefully handle missing videos without a loud console error
            console.warn("Notice: Could not load videos -", e.message || "Invalid channel ID");
            setVideos([]);
        }
        setVideosLoading(false);
    }

    async function handleSync() {
        if (!creator) return;
        setSyncing(true);
        try {
            const updated = await creators.syncYoutube(creator.id, creator.youtube_handle || creator.youtube_channel_id);
            setCreator(updated);
        } catch (e) {
            console.error("Sync failed:", e);
        }
        setSyncing(false);
    }

    const formatNumber = (n: number | undefined) => {
        if (!n) return "0";
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toLocaleString();
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

    if (loading) {
        return (
            <div className="animate-fade-in flex flex-col gap-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap={16}>
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
                </ResponsiveGrid>
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-lg font-semibold">Creator not found</h2>
                <Link href="/dashboard/creators">
                    <Button variant="outline" className="mt-4 gap-2">
                        <ArrowLeft size={14} /> Back to Creators
                    </Button>
                </Link>
            </div>
        );
    }

    const avgViews = creator.total_views && creator.video_count
        ? Math.round(creator.total_views / creator.video_count)
        : 0;

    return (
        <div className="animate-fade-up flex flex-col gap-6">
            {/* Back Link */}
            <Link href="/dashboard/creators" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ArrowLeft size={12} /> Back to Creators
            </Link>

            {/* ── Creator Header ─────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    {creator.avatar_url ? (
                        <img
                            src={creator.avatar_url}
                            alt={creator.name}
                            className="w-16 h-16 rounded-full border-2 border-accent-brand/30 shadow-lg shadow-accent-brand/10"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-accent-brand/20">
                            {creator.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{creator.name}</h1>
                            <Badge
                                variant="outline"
                                className={`text-[10px] ${creator.status === "active" ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${creator.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                                {creator.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            {creator.youtube_handle && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Youtube size={13} className="text-red-500" /> {creator.youtube_handle}
                                </span>
                            )}
                            {creator.email && (
                                <span className="text-sm text-muted-foreground">{creator.email}</span>
                            )}
                        </div>
                        <div className="flex gap-1.5 mt-2">
                            {(creator.platforms || []).map((p) => (
                                <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Syncing..." : "Sync YouTube"}
                    </Button>
                    {creator.youtube_channel_id && (
                        <a
                            href={`https://youtube.com/channel/${creator.youtube_channel_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <ExternalLink size={13} /> View Channel
                            </Button>
                        </a>
                    )}
                </div>
            </div>

            {/* ── Key Stats ──────────────────────────────────── */}
            <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap={16} className="stagger-children">
                <StatCard
                    label="Subscribers"
                    value={creator.subscribers || 0}
                    format={formatNumber}
                    icon={Users}
                />
                <StatCard
                    label="Total Views"
                    value={creator.total_views || 0}
                    format={formatNumber}
                    icon={Eye}
                />
                <StatCard
                    label="Videos Published"
                    value={creator.video_count || 0}
                    format={formatNumber}
                    icon={Play}
                />
                <StatCard
                    label="Avg. Views/Video"
                    value={avgViews}
                    format={formatNumber}
                    icon={BarChart3}
                />
            </ResponsiveGrid>

            {/* ── Bio & Details ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bio */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Globe size={14} className="text-accent-brand" /> About
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {creator.bio || "No bio available. Sync YouTube data to pull the creator's description."}
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Info */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles size={14} className="text-accent-brand" /> Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { label: "Member Since", value: formatDate(creator.created_at), icon: Calendar },
                                { label: "Last Updated", value: formatDate(creator.updated_at), icon: Clock },
                                { label: "Channel ID", value: creator.youtube_channel_id || "—", icon: Hash },
                                { label: "Engagement Rate", value: creator.subscribers && creator.total_views ? `${((creator.subscribers / creator.total_views) * 100).toFixed(2)}%` : "—", icon: TrendingUp },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <item.icon size={12} className="text-muted-foreground/70" /> {item.label}
                                    </span>
                                    <span className="text-xs font-medium text-foreground truncate max-w-[160px]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Creator DNA ────────────────────────────────── */}
            {creator.dna && (
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles size={14} className="text-accent-brand" /> Creator DNA
                            <Badge variant="secondary" className="text-[10px] ml-auto">
                                v{creator.dna.version} · {creator.dna.analyzed_posts} posts analyzed
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                                {(creator.dna.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveGrid columns={{ xs: 1, md: 3 }} gap={16}>
                            {/* Linguistics */}
                            {creator.dna.linguistics && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Linguistics</h4>
                                    <div className="space-y-1.5">
                                        {Object.entries(creator.dna.linguistics).slice(0, 5).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                                                <span className="font-medium">{typeof v === "number" ? (v as number).toFixed(1) : String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Style */}
                            {creator.dna.style && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style</h4>
                                    <div className="space-y-1.5">
                                        {Object.entries(creator.dna.style).slice(0, 5).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                                                <span className="font-medium">{typeof v === "number" ? (v as number).toFixed(1) : String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Content Patterns */}
                            {creator.dna.content_patterns && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Patterns</h4>
                                    <div className="space-y-1.5">
                                        {Object.entries(creator.dna.content_patterns).slice(0, 5).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                                                <span className="font-medium">{typeof v === "number" ? (v as number).toFixed(1) : String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ResponsiveGrid>
                    </CardContent>
                </Card>
            )}

            {/* ── Recent Videos ──────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Play size={14} className="text-accent-brand" /> Recent Videos
                        {videos.length > 0 && <Badge variant="secondary" className="text-[10px]">{videos.length}</Badge>}
                    </h2>
                    {creator.youtube_channel_id && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={() => creator.youtube_channel_id && loadVideos(creator.youtube_channel_id)}
                            disabled={videosLoading}
                        >
                            <RefreshCw size={12} className={videosLoading ? "animate-spin" : ""} /> Refresh
                        </Button>
                    )}
                </div>

                {videosLoading ? (
                    <ResponsiveGrid autoFill minItemWidth={280} gap={16}>
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
                    </ResponsiveGrid>
                ) : videos.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="py-12 text-center">
                            <Play size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">No videos loaded.</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                {creator.youtube_channel_id ? "Click refresh to load recent videos." : "Sync YouTube data first to pull videos."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <ResponsiveGrid autoFill minItemWidth={280} gap={16} className="stagger-children">
                        {videos.map((v: any) => (
                            <Card key={v.video_id} className="card-glow bg-card border-border group overflow-hidden">
                                {/* Thumbnail */}
                                {v.thumbnail && (
                                    <a href={`https://youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-secondary overflow-hidden">
                                        <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play size={36} className="text-white drop-shadow-lg" />
                                        </div>
                                    </a>
                                )}
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-accent-brand transition-colors min-h-[2.5rem]">
                                        {v.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(v.tags || []).slice(0, 3).map((t: string) => (
                                            <Badge key={t} variant="secondary" className="text-[9px] h-4">{t}</Badge>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                                        <div className="text-center">
                                            <div className="text-xs font-semibold">{formatNumber(v.views)}</div>
                                            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                                <Eye size={9} /> Views
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-semibold">{formatNumber(v.likes)}</div>
                                            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                                <ThumbsUp size={9} /> Likes
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-semibold">{formatNumber(v.comments)}</div>
                                            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                                <MessageCircle size={9} /> Comments
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                            {formatDate(v.published_at)}
                                        </span>
                                        <a
                                            href={`https://youtube.com/watch?v=${v.video_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-accent-brand hover:underline flex items-center gap-0.5"
                                        >
                                            Watch <ExternalLink size={9} />
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </ResponsiveGrid>
                )}
            </div>
        </div>
    );
}
