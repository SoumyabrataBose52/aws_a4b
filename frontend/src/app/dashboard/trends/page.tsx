"use client";

import { useEffect, useState } from "react";
import { youtube } from "@/lib/api";
import { TrendingUp, Search, Flame, PlayCircle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveGrid } from "@/components/ui/responsive-grid";

export default function TrendsPage() {
    const [trending, setTrending] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        youtube.trending("IN", 20)
            .then((t) => setTrending(t.videos || []))
            .catch(() => { })
            .finally(() => setLoading(false));
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
                        Discovery & Trends
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
                            <Card key={r.video_id} className="card-glow bg-card border-border group overflow-hidden">
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

            {/* Trending Cards */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-warning" />
                    <h2 className="text-sm font-semibold">Trending in India</h2>
                    <Badge variant="secondary" className="text-[10px] ml-1">{trending.length} videos</Badge>
                </div>

                <ResponsiveGrid autoFill minItemWidth={280} gap={16} className="stagger-children">
                    {trending.map((v: any, i: number) => (
                        <Card key={v.video_id} className="card-glow bg-card border-border group overflow-hidden">
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
        </div>
    );
}
