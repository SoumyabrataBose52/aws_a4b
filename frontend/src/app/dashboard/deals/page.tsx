'use client';
import { useEffect, useState } from 'react';
import { deals, creators } from '@/lib/api';
import { Handshake, X, Search, Plus } from 'lucide-react';

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
            <div className="flex justify-between items-center mb-7">
                <div>
                    <h1 className="text-[28px] font-bold flex items-center gap-2">
                        <Handshake size={24} className="text-accent" /> Deal Pipeline
                    </h1>
                    <p className="text-text-secondary text-sm">Track and negotiate brand partnerships</p>
                </div>
                <button className="btn-glow flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
                    {showForm ? <><X size={14} /> Close</> : <><Plus size={14} /> New Deal</>}
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
                        <input className="input-dark" placeholder="Brand Name" required value={formData.brand_name}
                            onChange={e => setFormData(p => ({ ...p, brand_name: e.target.value }))} />
                        <input className="input-dark" placeholder="Proposed Rate (₹)" type="number" value={formData.proposed_rate}
                            onChange={e => setFormData(p => ({ ...p, proposed_rate: parseInt(e.target.value) }))} />
                        <textarea className="input-dark col-span-2" placeholder="Deliverables (one per line)" value={formData.deliverables}
                            onChange={e => setFormData(p => ({ ...p, deliverables: e.target.value }))} style={{ minHeight: '60px' }} />
                        <button className="btn-glow col-span-2 flex items-center justify-center gap-2" type="submit" disabled={submitting}>
                            <Handshake size={14} /> {submitting ? 'Creating...' : 'Create Deal'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <Handshake size={48} className="mx-auto mb-3 opacity-40 text-text-secondary" />
                    <h3 className="font-semibold">No deals yet</h3>
                    <p className="text-text-secondary text-sm">Start tracking brand partnerships</p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
                    {list.map((d: any) => {
                        const creatorName = creatorList.find((c: any) => c.id === d.creator_id)?.name || 'Unknown';
                        return (
                            <div key={d.id} className="glass-card p-5">
                                <div className="flex justify-between items-center mb-2.5">
                                    <h3 className="font-semibold text-base">{d.brand_name}</h3>
                                    <span className={`badge ${statusColors[d.status] || 'badge-neutral'}`}>{d.status}</span>
                                </div>
                                <div className="text-[13px] text-text-secondary mb-2">For: {creatorName}</div>
                                <div className="text-2xl font-bold text-success mb-2.5">
                                    ₹{(d.proposed_rate || 0).toLocaleString('en-IN')}
                                </div>
                                {(d.deliverables || []).length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap mb-3.5">
                                        {d.deliverables.map((del: string, i: number) => (
                                            <span key={i} className="badge badge-neutral">{del}</span>
                                        ))}
                                    </div>
                                )}
                                {research[d.id] && (
                                    <div className="p-2.5 bg-bg-secondary rounded-lg mb-3 text-[13px]">
                                        <div className="font-semibold mb-1">Market Research</div>
                                        <div>Industry: {research[d.id].brand_industry}</div>
                                        <div>Rates: ₹{research[d.id].suggested_rates?.percentile25?.toLocaleString()} - ₹{research[d.id].suggested_rates?.percentile75?.toLocaleString()}</div>
                                    </div>
                                )}
                                <button className="btn-secondary text-[13px] w-full flex items-center justify-center gap-2" onClick={() => handleResearch(d.id)} disabled={researching === d.id}>
                                    <Search size={14} /> {researching === d.id ? 'Researching...' : 'Research Brand'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
