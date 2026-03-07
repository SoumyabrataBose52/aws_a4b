"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { youtube } from "@/lib/api";
import { TrendingUp, Search, Flame, PlayCircle, Eye, X, ThumbsUp, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveGrid } from "@/components/ui/responsive-grid";
import { YouTubePlayer } from "@/components/ui/youtube-player";

interface VideoModalData {
    video_id: string;
    title: string;
    channel_title: string;
    views?: number;
    likes?: number;
    comments?: number;
    published_at?: string;
}

export default function TrendsPage() {
    const [trending, setTrending] = useState<any[]>([]);
    const [keywordsData, setKeywordsData] = useState<any>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [activeVideo, setActiveVideo] = useState<VideoModalData | null>(null);

    useEffect(() => {
        Promise.all([
            youtube.trending("IN", 20).catch(() => ({ videos: [] })),
            youtube.trendingKeywords("IN", 30).catch(() => null)
        ]).then(([t, kw]) => {
            setTrending(t.videos || []);
            setKeywordsData(kw);
            setLoading(false);
        });
    }, []);

    // Close modal on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setActiveVideo(null);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const r = await youtube.search(searchQuery);
            setSearchResults(r.results || []);
        } catch { }
        setSearching(false);
    };

    const openVideo = useCallback((v: any) => {
        setActiveVideo({
            video_id: v.video_id,
            title: v.title,
            channel_title: v.channel_title,
            views: v.views,
            likes: v.likes,
            comments: v.comments,
            published_at: v.published_at,
        });
    }, []);

    const formatViews = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
        return v.toString();
    };

    if (loading) {
        return (
            <div className="animate-fade-in flex flex-col gap-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full md:w-96" />
                <ResponsiveGrid autoFill minItemWidth={280} gap={16}>
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
                </ResponsiveGrid>
            </div>
        );
    }

    return (
        <div className="animate-fade-up flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Discovery &amp; Trends
                        <span className="relative flex h-2 w-2 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time YouTube trending intelligence for India.</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
                        <Input
                            placeholder="Search YouTube..."
                            className="pl-8 h-9 w-full md:w-64 bg-secondary/50 border-border text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" size="sm" disabled={searching} className="bg-accent-brand hover:bg-accent-brand/90 text-white h-9">
                        {searching ? "Searching..." : "Search"}
                    </Button>
                </form>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold flex items-center gap-2">
                            <Search size={14} className="text-accent-brand" /> Search Results
                        </h2>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSearchResults([])}>
                            Clear
                        </Button>
                    </div>
                    <ResponsiveGrid autoFill minItemWidth={280} gap={16} className="stagger-children">
                        {searchResults.map((r: any) => (
                            <Card
                                key={r.video_id}
                                className="card-glow bg-card border-border group overflow-hidden cursor-pointer"
                                onClick={() => openVideo(r)}
                            >
                                <div className="relative aspect-video bg-secondary overflow-hidden">
                                    <img src={r.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <PlayCircle size={40} className="text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-accent-brand transition-colors">
                                        {r.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">{r.channel_title}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </ResponsiveGrid>
                </div>
            )}

            {/* Emerging Topics & Keywords */}
            {keywordsData && keywordsData.topics && keywordsData.topics.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Flame size={16} className="text-accent-brand" />
                        <h2 className="text-sm font-semibold">Emerging Topics</h2>
                        <Badge variant="secondary" className="text-[10px] ml-1">AI Extracted</Badge>
                    </div>
                    <ResponsiveGrid autoFill minItemWidth={300} gap={16} className="stagger-children">
                        {keywordsData.topics.slice(0, 6).map((topic: any, i: number) => (
                            <Card key={i} className="bg-card border-border p-4 hover:border-accent-brand/50 transition-colors">
                                <h3 className="text-sm font-semibold capitalize mb-3 text-white flex justify-between items-center">
                                    {topic.topic}
                                    <span className="text-[10px] bg-accent-brand/20 text-accent-brand px-2 py-0.5 rounded-full font-bold">
                                        Score: {topic.weight}
                                    </span>
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {topic.keywords.map((kw: string, j: number) => (
                                        <Badge key={j} variant="secondary" className="text-[10px] bg-secondary/50 text-muted-foreground hover:text-white transition-colors">
                                            {kw}
                                        </Badge>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </ResponsiveGrid>
                </div>
            )}

            {/* Trending Cards */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-warning" />
                    <h2 className="text-sm font-semibold">Trending in India</h2>
                    <Badge variant="secondary" className="text-[10px] ml-1">{trending.length} videos</Badge>
                </div>

                <ResponsiveGrid autoFill minItemWidth={280} gap={16} className="stagger-children">
                    {trending.map((v: any, i: number) => (
                        <Card
                            key={v.video_id}
                            className="card-glow bg-card border-border group overflow-hidden cursor-pointer"
                            onClick={() => openVideo(v)}
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-secondary overflow-hidden">
                                <img src={v.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <PlayCircle size={40} className="text-white drop-shadow-lg" />
                                </div>
                                {/* Rank Badge */}
                                <div className="absolute top-2 left-2">
                                    {i < 3 ? (
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${i === 0 ? "bg-danger/80 text-white" : i === 1 ? "bg-warning/80 text-white" : "bg-accent-brand/80 text-white"
                                            }`}>
                                            <Flame size={10} /> #{i + 1}
                                        </div>
                                    ) : (
                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-sm">
                                            #{i + 1}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <CardContent className="p-4">
                                <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-accent-brand transition-colors min-h-[2.5rem]">
                                    {v.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{v.channel_title}</p>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Eye size={12} />
                                        <span>{formatViews(Number(v.views))}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                        {new Date(v.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </ResponsiveGrid>
            </div>

            {/* ── Video Player Modal ──────────────────────────── */}
            {activeVideo && (
                <VideoPlayerModal
                    video={activeVideo}
                    onClose={() => setActiveVideo(null)}
                    formatViews={formatViews}
                />
            )}
        </div>
    );
}


/* ── Video Player Modal Component ─────────────────────────── */
function VideoPlayerModal({
    video,
    onClose,
    formatViews,
}: {
    video: VideoModalData;
    onClose: () => void;
    formatViews: (v: number) => string;
}) {
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(true);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        async function fetchComments() {
            setCommentsLoading(true);
            try {
                const res = await youtube.videoComments(video.video_id);
                setComments(res.comments || []);
            } catch {
                setComments([]);
            }
            setCommentsLoading(false);
        }
        fetchComments();
    }, [video.video_id]);

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm animate-fade-in" />

            {/* Scroll wrapper — centers the modal both ways */}
            <div className="relative flex min-h-screen items-center justify-center py-12 px-4 md:px-8">
                {/* Modal Content — capped width, auto-centered */}
                <div
                    className="w-full max-w-4xl animate-fade-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-10 right-0 md:-top-12 md:-right-2 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-xs z-20"
                    >
                        <span className="hidden md:inline">Press ESC to close</span>
                        <X size={20} />
                    </button>

                    {/* Player + Info + Comments Container */}
                    <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                        {/* YouTube Player */}
                        <div className="aspect-video bg-black">
                            <YouTubePlayer
                                videoId={video.video_id}
                                autoplay
                            />
                        </div>

                        {/* Video Info Bar */}
                        <div className="bg-card/95 backdrop-blur-md border-t border-border/50 px-5 py-4">
                            <h3 className="text-sm font-semibold line-clamp-2 leading-snug">
                                {video.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                    {video.channel_title}
                                </span>
                                <div className="flex items-center gap-4">
                                    {video.views != null && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Eye size={11} /> {formatViews(Number(video.views))}
                                        </span>
                                    )}
                                    {video.likes != null && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <ThumbsUp size={11} /> {formatViews(Number(video.likes))}
                                        </span>
                                    )}
                                    {video.comments != null && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MessageCircle size={11} /> {formatViews(Number(video.comments))}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Comments Section ────────────────────── */}
                        <div className="bg-card/90 backdrop-blur-md border-t border-border/50 px-5 py-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                                <MessageCircle size={12} />
                                Comments {!commentsLoading && <Badge variant="secondary" className="text-[10px]">{comments.length}</Badge>}
                            </h4>

                            {commentsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex gap-3">
                                            <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-3 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-xs text-muted-foreground/60 text-center py-4">
                                    Comments are disabled or unavailable for this video.
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                                    {comments.map((c: any, idx: number) => (
                                        <div key={c.comment_id || idx} className="flex gap-3">
                                            {/* Avatar */}
                                            {c.author_profile_image ? (
                                                <img
                                                    src={c.author_profile_image}
                                                    alt={c.author}
                                                    className="w-7 h-7 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-brand/50 to-accent-violet/50 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                                    {c.author?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                            {/* Comment Body */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium truncate">
                                                        {c.author}
                                                    </span>
                                                    {c.published_at && (
                                                        <span className="text-[10px] text-muted-foreground/50" suppressHydrationWarning>
                                                            {new Date(c.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className="text-xs text-muted-foreground mt-0.5 leading-relaxed whitespace-pre-line break-words"
                                                    dangerouslySetInnerHTML={{ __html: c.text }}
                                                />
                                                {c.likes > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-1">
                                                        <ThumbsUp size={9} /> {c.likes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
