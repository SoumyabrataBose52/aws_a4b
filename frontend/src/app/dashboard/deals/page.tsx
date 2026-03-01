'use client';
import { useEffect, useState } from 'react';
import { deals, creators } from '@/lib/api';

export default function DealsPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ creator_id: '', brand_name: '', proposed_rate: 10000, deliverables: '' });
    const [submitting, setSubmitting] = useState(false);
    const [researching, setResearching] = useState<string | null>(null);
    const [research, setResearch] = useState<Record<string, any>>({});

    useEffect(() => {
        async function load() {
            try {
                const [d, cr] = await Promise.all([deals.list(), creators.list()]);
                setList(d);
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
            await deals.create({
                creator_id: formData.creator_id,
                brand_name: formData.brand_name,
                proposed_rate: formData.proposed_rate,
                deliverables: formData.deliverables.split('\n').filter(Boolean),
            });
            setShowForm(false);
            setList(await deals.list());
        } catch { }
        setSubmitting(false);
    };

    const handleResearch = async (dealId: string) => {
        setResearching(dealId);
        try {
            const r = await deals.research(dealId);
            setResearch(prev => ({ ...prev, [dealId]: r }));
        } catch { }
        setResearching(null);
    };

    const statusColors: Record<string, string> = {
        proposed: 'badge-accent', negotiating: 'badge-warning', accepted: 'badge-success',
        rejected: 'badge-danger', completed: 'badge-success',
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700 }}>🤝 Deal Pipeline</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Track and negotiate brand partnerships</p>
                </div>
                <button className="btn-glow" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Close' : '+ New Deal'}
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
                        <input className="input-dark" placeholder="Brand Name" required value={formData.brand_name}
                            onChange={e => setFormData(p => ({ ...p, brand_name: e.target.value }))} />
                        <input className="input-dark" placeholder="Proposed Rate (₹)" type="number" value={formData.proposed_rate}
                            onChange={e => setFormData(p => ({ ...p, proposed_rate: parseInt(e.target.value) }))} />
                        <textarea className="input-dark" placeholder="Deliverables (one per line)" value={formData.deliverables}
                            onChange={e => setFormData(p => ({ ...p, deliverables: e.target.value }))} style={{ gridColumn: '1 / -1', minHeight: '60px' }} />
                        <button className="btn-glow" type="submit" disabled={submitting} style={{ gridColumn: '1 / -1' }}>
                            {submitting ? 'Creating...' : '🤝 Create Deal'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>💼</div>
                    <h3 style={{ fontWeight: 600 }}>No deals yet</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Start tracking brand partnerships</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                    {list.map((d: any) => {
                        const creatorName = creatorList.find((c: any) => c.id === d.creator_id)?.name || 'Unknown';
                        return (
                            <div key={d.id} className="glass-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{d.brand_name}</h3>
                                    <span className={`badge ${statusColors[d.status] || 'badge-neutral'}`}>{d.status}</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>For: {creatorName}</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginBottom: '10px' }}>
                                    ₹{(d.proposed_rate || 0).toLocaleString('en-IN')}
                                </div>
                                {(d.deliverables || []).length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                        {d.deliverables.map((del: string, i: number) => (
                                            <span key={i} className="badge badge-neutral">{del}</span>
                                        ))}
                                    </div>
                                )}
                                {research[d.id] && (
                                    <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Market Research</div>
                                        <div>Industry: {research[d.id].brand_industry}</div>
                                        <div>Rates: ₹{research[d.id].suggested_rates?.percentile25?.toLocaleString()} - ₹{research[d.id].suggested_rates?.percentile75?.toLocaleString()}</div>
                                    </div>
                                )}
                                <button className="btn-secondary" onClick={() => handleResearch(d.id)} disabled={researching === d.id} style={{ fontSize: '13px', width: '100%' }}>
                                    {researching === d.id ? '🔍 Researching...' : '🔍 Research Brand'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
