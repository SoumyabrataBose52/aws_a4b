'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { creators } from '@/lib/api';
import { UserPlus, X, Trash2, ExternalLink } from 'lucide-react';

export default function CreatorsPage() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', bio: '', platforms: 'youtube', youtube_channel: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadCreators = async () => {
        try { setList(await creators.list()); } catch { }
        setLoading(false);
    };

    useEffect(() => { loadCreators(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const newCreator = await creators.create({
                name: formData.name,
                email: formData.email || undefined,
                bio: formData.bio || undefined,
                platforms: formData.platforms.split(',').map(p => p.trim()).filter(Boolean),
            });
            if (formData.youtube_channel) {
                try { await creators.onboard(newCreator.id, formData.youtube_channel); } catch { }
            }
            setFormData({ name: '', email: '', bio: '', platforms: 'youtube', youtube_channel: '' });
            setShowForm(false);
            loadCreators();
        } catch (e: any) { setError(e.message); }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this creator?')) return;
        try { await creators.delete(id); loadCreators(); } catch { }
    };

    return (
        <div className="animate-in">
            <div className="flex justify-between items-center mb-7">
                <div>
                    <h1 className="text-[28px] font-bold">Creators</h1>
                    <p className="text-text-secondary text-sm">Manage your creator roster</p>
                </div>
                <button className="btn-glow flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
                    {showForm ? <><X size={14} /> Cancel</> : <><UserPlus size={14} /> Add Creator</>}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="glass-card animate-in p-6 mb-6">
                    <h3 className="text-base font-semibold mb-4">New Creator</h3>
                    {error && <div className="text-danger mb-3 text-sm">{error}</div>}
                    <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
                        <input className="input-dark" placeholder="Name *" required value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        <input className="input-dark" placeholder="Email" type="email" value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                        <input className="input-dark" placeholder="Platforms (comma-separated)" value={formData.platforms}
                            onChange={e => setFormData(p => ({ ...p, platforms: e.target.value }))} />
                        <input className="input-dark" placeholder="YouTube @handle (auto-onboard)" value={formData.youtube_channel}
                            onChange={e => setFormData(p => ({ ...p, youtube_channel: e.target.value }))} />
                        <textarea className="input-dark col-span-2" placeholder="Bio" value={formData.bio}
                            onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: '60px' }} />
                        <div className="col-span-2">
                            <button className="btn-glow" type="submit" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create & Onboard'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <UserPlus size={48} className="mx-auto mb-3 opacity-40 text-text-secondary" />
                    <h3 className="font-semibold mb-2">No creators yet</h3>
                    <p className="text-text-secondary text-sm">Add your first creator to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
                    {list.map((c: any) => (
                        <div key={c.id} className="glass-card p-5">
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-lg font-bold text-white shrink-0"
                                    style={c.avatar_url ? { backgroundImage: `url(${c.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                                    {!c.avatar_url && c.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[15px] truncate">{c.name}</div>
                                    <div className="text-xs text-text-secondary truncate">{c.email || 'No email'}</div>
                                </div>
                                <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                            </div>
                            {c.bio && <p className="text-[13px] text-text-secondary mb-3 leading-relaxed">{c.bio.slice(0, 120)}{c.bio.length > 120 ? '...' : ''}</p>}
                            <div className="flex gap-1.5 flex-wrap mb-3.5">
                                {(c.platforms || []).map((p: string) => (
                                    <span key={p} className="badge badge-accent">{p}</span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/dashboard/creators/${c.id}`}
                                    className="btn-secondary flex-1 text-center text-[13px] py-2 px-3 no-underline flex items-center justify-center gap-1.5">
                                    <ExternalLink size={12} /> View Profile
                                </Link>
                                <button className="btn-secondary text-[13px] py-2 px-3 text-danger flex items-center gap-1.5" onClick={() => handleDelete(c.id)}>
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
