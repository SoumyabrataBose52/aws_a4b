'use client';
import { useEffect, useState } from 'react';
import { crisis, creators } from '@/lib/api';

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
        } catch (e: any) {
            console.error(e);
        }
        setStrategizing(null);
    };

    const threatColors: Record<string, string> = {
        critical: 'badge-danger', high: 'badge-danger', medium: 'badge-warning', low: 'badge-success',
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700 }}>🛡️ Crisis Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Monitor and respond to creator crises</p>
                </div>
                <button className="btn-glow" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Close' : '🚨 Report Crisis'}
                </button>
            </div>

            {showForm && (
                <div className="glass-card animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                        <textarea className="input-dark" placeholder="Triggering messages (one per line)" value={formData.triggering_messages}
                            onChange={e => setFormData(p => ({ ...p, triggering_messages: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
                        <button className="btn-glow" type="submit" disabled={submitting} style={{ gridColumn: '1 / -1' }}>
                            {submitting ? 'Creating...' : '🚨 Create Crisis Alert'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                    <h3 style={{ fontWeight: 600 }}>No active crises</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>All creators are in good standing</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {list.map((c: any) => {
                        const creatorName = creatorList.find((cr: any) => cr.id === c.creator_id)?.name || 'Unknown';
                        return (
                            <div key={c.id} className="glass-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={`badge ${threatColors[c.threat_level] || 'badge-neutral'}`}>{c.threat_level}</span>
                                        <span style={{ fontWeight: 600 }}>{creatorName}</span>
                                        <span className={`badge ${c.status === 'active' ? 'badge-danger' : 'badge-success'}`}>{c.status}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        Sentiment drop: {((c.sentiment_drop || 0) * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    {(c.affected_platforms || []).map((p: string) => <span key={p} className="badge badge-accent">{p}</span>)}
                                </div>

                                {/* Strategies */}
                                {strategies[c.id] && strategies[c.id].length > 0 && (
                                    <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>AI Response Strategies:</div>
                                        {strategies[c.id].map((s: any, i: number) => (
                                            <div key={i} style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: '8px', marginBottom: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span className="badge badge-accent">{s.type}</span>
                                                    <span className={`badge ${s.risk_level === 'low' ? 'badge-success' : s.risk_level === 'high' ? 'badge-danger' : 'badge-warning'}`}>{s.risk_level} risk</span>
                                                </div>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.message?.slice(0, 200)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className="btn-secondary" onClick={() => generateStrats(c.id)} disabled={strategizing === c.id} style={{ fontSize: '13px' }}>
                                    {strategizing === c.id ? '🧠 Generating...' : '⚡ Generate Strategies'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
