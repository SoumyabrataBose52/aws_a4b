'use client';
import { useEffect, useState } from 'react';
import { youtube } from '@/lib/api';

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
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700 }}>📈 Trends</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Live YouTube trending data from India</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input className="input-dark" placeholder="Search YouTube for topic..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1 }} />
                <button className="btn-glow" type="submit" disabled={searching}>
                    {searching ? 'Searching...' : '🔍 Search'}
                </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>Search Results: &quot;{searchQuery}&quot;</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                        {searchResults.map((v: any) => (
                            <div key={v.video_id} className="glass-card" style={{ padding: '14px' }}>
                                {v.thumbnail && <img src={v.thumbnail} alt={v.title} style={{ width: '100%', borderRadius: '10px', marginBottom: '10px' }} />}
                                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px', lineHeight: 1.4 }}>{v.title}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.channel_title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trending */}
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>🔥 Trending Now</h2>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                    {trending.map((v: any, i: number) => (
                        <div key={v.video_id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            {v.thumbnail && (
                                <div style={{ position: 'relative' }}>
                                    <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute', top: '8px', left: '8px',
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 700, color: 'var(--accent)',
                                    }}>
                                        {i + 1}
                                    </div>
                                </div>
                            )}
                            <div style={{ padding: '14px' }}>
                                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {v.title}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    {v.channel_title}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <span>👁️ {formatViews(v.views)}</span>
                                    <span>👍 {formatViews(v.likes)}</span>
                                    <span>💬 {formatViews(v.comments)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
