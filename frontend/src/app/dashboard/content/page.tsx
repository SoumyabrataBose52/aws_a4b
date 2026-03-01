'use client';
import { useEffect, useState } from 'react';
import { content, creators } from '@/lib/api';

export default function ContentPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGen, setShowGen] = useState(false);
    const [genData, setGenData] = useState({ creator_id: '', topic: '', platforms: 'instagram,youtube' });
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const [c, cl] = await Promise.all([content.list(), creators.list()]);
                setList(c);
                setCreatorList(cl);
                if (cl.length > 0 && !genData.creator_id) setGenData(p => ({ ...p, creator_id: cl[0].id }));
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setGenResult(null);
        try {
            const result = await content.generate({
                creator_id: genData.creator_id,
                topic: genData.topic,
                platforms: genData.platforms.split(',').map(p => p.trim()),
            });
            setGenResult(result);
            // Refresh list
            setList(await content.list());
        } catch (e: any) {
            setGenResult({ error: e.message });
        }
        setGenerating(false);
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Content</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>AI-generated content matched to creator voices</p>
                </div>
                <button className="btn-glow" onClick={() => setShowGen(!showGen)}>
                    {showGen ? '✕ Close' : '✨ Generate Content'}
                </button>
            </div>

            {/* Generation Form */}
            {showGen && (
                <div className="glass-card pulse-glow animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>✨ AI Content Generator</h3>
                    <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <select className="input-dark" value={genData.creator_id}
                            onChange={e => setGenData(p => ({ ...p, creator_id: e.target.value }))}>
                            <option value="">Select Creator</option>
                            {creatorList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input className="input-dark" placeholder="Platforms (comma-separated)" value={genData.platforms}
                            onChange={e => setGenData(p => ({ ...p, platforms: e.target.value }))} />
                        <input className="input-dark" placeholder="Topic (e.g., AI tools for creators)" value={genData.topic}
                            onChange={e => setGenData(p => ({ ...p, topic: e.target.value }))} required style={{ gridColumn: '1 / -1' }} />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button className="btn-glow" type="submit" disabled={generating || !genData.creator_id}>
                                {generating ? '🧠 Generating...' : '⚡ Generate'}
                            </button>
                        </div>
                    </form>

                    {genResult && (
                        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            {genResult.error ? (
                                <p style={{ color: 'var(--danger)' }}>{genResult.error}</p>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span className="badge badge-success">Generated</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Style match: {((genResult.style_match_score || 0) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{genResult.content?.text}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Content List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✏️</div>
                    <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No content yet</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Generate your first piece of AI content</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {list.map((c: any) => (
                        <div key={c.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                                    <span className={`badge ${c.status === 'published' ? 'badge-success' : c.status === 'scheduled' ? 'badge-warning' : 'badge-neutral'}`}>{c.status}</span>
                                    {c.platform && <span className="badge badge-accent">{c.platform}</span>}
                                </div>
                                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                                    {c.text?.slice(0, 200)}{c.text?.length > 200 ? '...' : ''}
                                </p>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    Created: {new Date(c.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
