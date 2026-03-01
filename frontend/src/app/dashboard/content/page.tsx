'use client';
import { useEffect, useState } from 'react';
import { content, creators } from '@/lib/api';
import { Sparkles, X, FileText, Wand2 } from 'lucide-react';

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
            setList(await content.list());
        } catch (e: any) {
            setGenResult({ error: e.message });
        }
        setGenerating(false);
    };

    return (
        <div className="animate-in">
            <div className="flex justify-between items-center mb-7">
                <div>
                    <h1 className="text-[28px] font-bold">Content</h1>
                    <p className="text-text-secondary text-sm">AI-generated content matched to creator voices</p>
                </div>
                <button className="btn-glow flex items-center gap-2" onClick={() => setShowGen(!showGen)}>
                    {showGen ? <><X size={14} /> Close</> : <><Sparkles size={14} /> Generate Content</>}
                </button>
            </div>

            {/* Generation Form */}
            {showGen && (
                <div className="glass-card pulse-glow animate-in p-6 mb-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                        <Wand2 size={16} className="text-accent" /> AI Content Generator
                    </h3>
                    <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-3">
                        <select className="input-dark" value={genData.creator_id}
                            onChange={e => setGenData(p => ({ ...p, creator_id: e.target.value }))}>
                            <option value="">Select Creator</option>
                            {creatorList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input className="input-dark" placeholder="Platforms (comma-separated)" value={genData.platforms}
                            onChange={e => setGenData(p => ({ ...p, platforms: e.target.value }))} />
                        <input className="input-dark col-span-2" placeholder="Topic (e.g., AI tools for creators)" value={genData.topic}
                            onChange={e => setGenData(p => ({ ...p, topic: e.target.value }))} required />
                        <div className="col-span-2">
                            <button className="btn-glow flex items-center gap-2" type="submit" disabled={generating || !genData.creator_id}>
                                {generating ? <><Wand2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate</>}
                            </button>
                        </div>
                    </form>

                    {genResult && (
                        <div className="mt-4 p-4 bg-bg-secondary rounded-xl">
                            {genResult.error ? (
                                <p className="text-danger">{genResult.error}</p>
                            ) : (
                                <>
                                    <div className="flex justify-between mb-2">
                                        <span className="badge badge-success">Generated</span>
                                        <span className="text-xs text-text-secondary">
                                            Style match: {((genResult.style_match_score || 0) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{genResult.content?.text}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Content List */}
            {loading ? (
                <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <FileText size={48} className="mx-auto mb-3 opacity-40 text-text-secondary" />
                    <h3 className="font-semibold mb-2">No content yet</h3>
                    <p className="text-text-secondary text-sm">Generate your first piece of AI content</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {list.map((c: any) => (
                        <div key={c.id} className="glass-card p-4 flex items-start gap-3.5">
                            <div className="flex-1">
                                <div className="flex gap-2 mb-1.5 items-center">
                                    <span className={`badge ${c.status === 'published' ? 'badge-success' : c.status === 'scheduled' ? 'badge-warning' : 'badge-neutral'}`}>{c.status}</span>
                                    {c.platform && <span className="badge badge-accent">{c.platform}</span>}
                                </div>
                                <p className="text-sm leading-relaxed text-text-primary">
                                    {c.text?.slice(0, 200)}{c.text?.length > 200 ? '...' : ''}
                                </p>
                                <div className="text-xs text-text-secondary mt-1.5">
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
