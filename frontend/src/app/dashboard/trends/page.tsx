'use client';
import { useEffect, useState } from 'react';
import { youtube } from '@/lib/api';
import { TrendingUp, Search, Eye, ThumbsUp, MessageCircle } from 'lucide-react';

export default function TrendsPage() {
    const [trending, setTrending] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const t = await youtube.trending('IN', 20);
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

    const formatViews = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
        return v.toString();
    };

    return (
        <div className="animate-in">
            <div className="mb-7">
                <h1 className="text-[28px] font-bold flex items-center gap-2">
                    <TrendingUp size={24} className="text-accent" /> Trends
                </h1>
                <p className="text-text-secondary text-sm">Live YouTube trending data from India</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2.5 mb-6">
                <input className="input-dark flex-1" placeholder="Search YouTube for topic..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} />
                <button className="btn-glow flex items-center gap-2" type="submit" disabled={searching}>
                    <Search size={14} /> {searching ? 'Searching...' : 'Search'}
                </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-7">
                    <h2 className="text-base font-semibold mb-3.5">Search Results: &quot;{searchQuery}&quot;</h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
                        {searchResults.map((v: any) => (
                            <div key={v.video_id} className="glass-card p-3.5">
                                {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-full rounded-[10px] mb-2.5" />}
                                <div className="font-medium text-sm mb-1 leading-snug">{v.title}</div>
                                <div className="text-xs text-text-secondary">{v.channel_title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trending */}
            <h2 className="text-base font-semibold mb-3.5 flex items-center gap-2">
                <TrendingUp size={16} className="text-warning" /> Trending Now
            </h2>
            {loading ? (
                <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
                    {trending.map((v: any, i: number) => (
                        <div key={v.video_id} className="glass-card overflow-hidden">
                            {v.thumbnail && (
                                <div className="relative">
                                    <img src={v.thumbnail} alt={v.title} className="w-full h-[170px] object-cover" />
                                    <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-sm flex items-center justify-center text-[13px] font-bold text-accent">
                                        {i + 1}
                                    </div>
                                </div>
                            )}
                            <div className="p-3.5">
                                <div className="font-medium text-sm mb-1.5 leading-snug line-clamp-2">{v.title}</div>
                                <div className="text-xs text-text-secondary mb-2">{v.channel_title}</div>
                                <div className="flex gap-3 text-xs text-text-secondary">
                                    <span className="flex items-center gap-1"><Eye size={12} /> {formatViews(v.views)}</span>
                                    <span className="flex items-center gap-1"><ThumbsUp size={12} /> {formatViews(v.likes)}</span>
                                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {formatViews(v.comments)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
