"use client";

import { useEffect, useState } from "react";
import { youtube } from "@/lib/api";
import { TrendingUp, Search, Eye, ThumbsUp, MessageCircle, Youtube, Calendar, Activity, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/premium/glass-panel";
import { ShimmerButton } from "@/components/ui/premium/shimmer-button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TrendsPage() {
    const [trending, setTrending] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const t = await youtube.trending("IN", 12);
                setTrending(t.videos || []);
            } catch { }
            setLoading(false);
        }
        load();
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

    const formatMetrics = (v: number) => {
        if (!v) return '0';
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
        return v.toString();
    };

    const VideoCard = ({ video, index }: { video: any, index?: number }) => (
        <GlassPanel className="flex flex-col overflow-hidden h-full group hover:border-[#ff0000]/30 transition-all duration-500">
            <div className="relative aspect-video w-full overflow-hidden shrink-0">
                <img
                    src={video.thumbnail?.high?.url || video.thumbnail?.medium?.url || "/placeholder.jpg"}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/20 to-transparent" />

                {/* Overlay Elements */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10 shadow-lg">
                        <Youtube size={12} className="mr-1.5 text-[#ff0000]" /> {video.channel_title}
                    </Badge>
                    {index !== undefined && (
                        <div className="w-8 h-8 rounded-full bg-[#ff0000] text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-[#ff0000]/20 border border-white/20">
                            #{index + 1}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white drop-shadow-md">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 backdrop-saturate-150">
                        <Calendar size={12} className="text-accent-brand" />
                        <span suppressHydrationWarning>{new Date(video.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1 text-white gap-3 bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="font-bold text-[15px] leading-tight line-clamp-2 group-hover:text-[#ff0000] transition-colors">{video.title}</h3>

                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold flex items-center gap-1"><Eye size={10} className="text-blue-400" /> Views</span>
                        <span className="text-sm font-bold">{formatMetrics(video.view_count)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold flex items-center gap-1"><ThumbsUp size={10} className="text-success" /> Likes</span>
                        <span className="text-sm font-bold">{formatMetrics(video.like_count)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold flex items-center gap-1"><MessageCircle size={10} className="text-warning" /> Comments</span>
                        <span className="text-sm font-bold">{formatMetrics(video.comment_count)}</span>
                    </div>
                </div>
            </div>
        </GlassPanel>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-[#ff0000] animate-spin" />
                </div>
                <p className="text-text-secondary text-sm animate-pulse">Syncing YouTube Data...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight flex items-center gap-2">
                        <TrendingUp className="text-[#ff0000]" /> Viral Trends Radar
                    </h1>
                    <p className="text-text-secondary text-sm">Real-time YouTube trending data and topic analysis.</p>
                </div>
            </div>

            {/* Premium Search Bar */}
            <form onSubmit={handleSearch} className="relative group max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-brand/20 to-[#00d2d3]/20 rounded-2xl blur-lg opacity-50 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center p-2 rounded-2xl bg-[#12121a]/90 border border-white/10 backdrop-blur-xl gap-2">
                    <Search className="text-text-secondary ml-3 shrink-0" size={20} />
                    <Input
                        className="border-0 bg-transparent text-white focus-visible:ring-0 text-base h-12 shadow-none placeholder:text-text-secondary/50"
                        placeholder="Search YouTube for viral topics, gaming, tech..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <ShimmerButton
                        type="submit"
                        disabled={searching || !searchQuery.trim()}
                        className="py-3 px-6 rounded-xl shrink-0"
                        shimmerColor="#ffffff"
                    >
                        {searching ? <Loader2 size={16} className="animate-spin text-white" /> : <span className="font-bold text-white text-sm">Analyze</span>}
                    </ShimmerButton>
                </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity size={18} className="text-[#00d2d3]" />
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Top Search Results</h2>
                        <Badge variant="outline" className="ml-2 border-[#00d2d3]/30 text-[#00d2d3] bg-[#00d2d3]/10">"{searchQuery}"</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                </div>
            )}

            {/* Trending Section */}
            {!searching && searchResults.length === 0 && (
                <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20">
                            <TrendingUp size={18} className="text-[#ff0000]" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Top Trending Right Now (IN)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {trending.map((video, index) => (
                            <VideoCard key={video.id} video={video} index={index} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
