'use client';
import { useEffect, useState } from 'react';
import { crisis, creators } from '@/lib/api';
import { Shield, X, AlertTriangle, Zap, Brain } from 'lucide-react';

export default function CrisisPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        creator_id: '', threat_level: 'medium', sentiment_drop: 0.3,
        affected_platforms: 'instagram', triggering_messages: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [strategizing, setStrategizing] = useState<string | null>(null);
    const [strategies, setStrategies] = useState<Record<string, any[]>>({});

    useEffect(() => {
        async function load() {
            try {
                const [cl, cr] = await Promise.all([crisis.list(), creators.list()]);
                setList(cl);
                setCreatorList(cr);
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await crisis.create({
                creator_id: formData.creator_id,
                threat_level: formData.threat_level,
                sentiment_drop: formData.sentiment_drop,
                affected_platforms: formData.affected_platforms.split(',').map(p => p.trim()),
                triggering_messages: formData.triggering_messages.split('\n').filter(Boolean),
            });
            setShowForm(false);
            setList(await crisis.list());
        } catch { }
        setSubmitting(false);
    };

    const generateStrats = async (crisisId: string) => {
        setStrategizing(crisisId);
        try {
            const strats = await crisis.generateStrategies(crisisId);
            setStrategies(prev => ({ ...prev, [crisisId]: strats }));
        } catch (e: any) { console.error(e); }
        setStrategizing(null);
    };

    const threatColors: Record<string, string> = {
        critical: 'badge-danger', high: 'badge-danger', medium: 'badge-warning', low: 'badge-success',
    };

    return (
        <div className="animate-in">
            <div className="flex justify-between items-center mb-7">
                <div>
                    <h1 className="text-[28px] font-bold flex items-center gap-2">
                        <Shield size={24} className="text-accent" /> Crisis Center
                    </h1>
                    <p className="text-text-secondary text-sm">Monitor and respond to creator crises</p>
                </div>
                <button className="btn-glow flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
                    {showForm ? <><X size={14} /> Close</> : <><AlertTriangle size={14} /> Report Crisis</>}
                </button>
            </div>

            {showForm && (
                <div className="glass-card animate-in p-6 mb-6">
                    <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
                        <select className="input-dark" value={formData.creator_id} required
                            onChange={e => setFormData(p => ({ ...p, creator_id: e.target.value }))}>
                            <option value="">Select Creator</option>
                            {creatorList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select className="input-dark" value={formData.threat_level}
                            onChange={e => setFormData(p => ({ ...p, threat_level: e.target.value }))}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <input className="input-dark" placeholder="Affected Platforms (comma-separated)" value={formData.affected_platforms}
                            onChange={e => setFormData(p => ({ ...p, affected_platforms: e.target.value }))} />
                        <input className="input-dark" placeholder="Sentiment Drop (0-1)" type="number" step="0.1" min="0" max="1"
                            value={formData.sentiment_drop} onChange={e => setFormData(p => ({ ...p, sentiment_drop: parseFloat(e.target.value) }))} />
                        <textarea className="input-dark col-span-2" placeholder="Triggering messages (one per line)" value={formData.triggering_messages}
                            onChange={e => setFormData(p => ({ ...p, triggering_messages: e.target.value }))} />
                        <button className="btn-glow col-span-2 flex items-center justify-center gap-2" type="submit" disabled={submitting}>
                            <AlertTriangle size={14} /> {submitting ? 'Creating...' : 'Create Crisis Alert'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <Shield size={48} className="mx-auto mb-3 text-success opacity-60" />
                    <h3 className="font-semibold">No active crises</h3>
                    <p className="text-text-secondary text-sm">All creators are in good standing</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3.5">
                    {list.map((c: any) => {
                        const creatorName = creatorList.find((cr: any) => cr.id === c.creator_id)?.name || 'Unknown';
                        return (
                            <div key={c.id} className="glass-card p-5">
                                <div className="flex justify-between items-center mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`badge ${threatColors[c.threat_level] || 'badge-neutral'}`}>{c.threat_level}</span>
                                        <span className="font-semibold">{creatorName}</span>
                                        <span className={`badge ${c.status === 'active' ? 'badge-danger' : 'badge-success'}`}>{c.status}</span>
                                    </div>
                                    <span className="text-xs text-text-secondary">
                                        Sentiment drop: {((c.sentiment_drop || 0) * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex gap-1.5 mb-3 flex-wrap">
                                    {(c.affected_platforms || []).map((p: string) => <span key={p} className="badge badge-accent">{p}</span>)}
                                </div>

                                {strategies[c.id] && strategies[c.id].length > 0 && (
                                    <div className="mb-3 p-3 bg-bg-secondary rounded-[10px]">
                                        <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5">
                                            <Brain size={14} className="text-accent" /> AI Response Strategies
                                        </div>
                                        {strategies[c.id].map((s: any, i: number) => (
                                            <div key={i} className="p-2 bg-bg-card rounded-lg mb-1.5">
                                                <div className="flex justify-between mb-1">
                                                    <span className="badge badge-accent">{s.type}</span>
                                                    <span className={`badge ${s.risk_level === 'low' ? 'badge-success' : s.risk_level === 'high' ? 'badge-danger' : 'badge-warning'}`}>{s.risk_level} risk</span>
                                                </div>
                                                <p className="text-[13px] text-text-secondary">{s.message?.slice(0, 200)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className="btn-secondary text-[13px] flex items-center gap-2" onClick={() => generateStrats(c.id)} disabled={strategizing === c.id}>
                                    <Zap size={14} /> {strategizing === c.id ? 'Generating...' : 'Generate Strategies'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
