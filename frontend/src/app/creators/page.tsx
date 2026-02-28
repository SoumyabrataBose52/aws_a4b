'use client';
import { useEffect, useState } from 'react';
import { creators } from '@/lib/api';

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

            // Auto-onboard with YouTube if channel provided
            if (formData.youtube_channel) {
                try {
                    await creators.onboard(newCreator.id, formData.youtube_channel);
                } catch (e) {
                    console.warn('Onboarding had an issue, creator still created');
                }
            }

            setFormData({ name: '', email: '', bio: '', platforms: 'youtube', youtube_channel: '' });
            setShowForm(false);
            loadCreators();
        } catch (e: any) {
            setError(e.message);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this creator?')) return;
        try { await creators.delete(id); loadCreators(); } catch { }
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Creators</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your creator roster</p>
                </div>
                <button className="btn-glow" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Creator'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="glass-card animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>New Creator</h3>
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input className="input-dark" placeholder="Name *" required value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        <input className="input-dark" placeholder="Email" type="email" value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                        <input className="input-dark" placeholder="Platforms (comma-separated)" value={formData.platforms}
                            onChange={e => setFormData(p => ({ ...p, platforms: e.target.value }))} />
                        <input className="input-dark" placeholder="YouTube @handle (auto-onboard)" value={formData.youtube_channel}
                            onChange={e => setFormData(p => ({ ...p, youtube_channel: e.target.value }))} />
                        <textarea className="input-dark" placeholder="Bio" value={formData.bio}
                            onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} style={{ gridColumn: '1 / -1', minHeight: '60px' }} />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button className="btn-glow" type="submit" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create & Onboard'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Creators List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : list.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
                    <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No creators yet</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Add your first creator to get started</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {list.map((c: any) => (
                        <div key={c.id} className="glass-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: c.avatar_url ? `url(${c.avatar_url}) center/cover` : 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0,
                                }}>
                                    {!c.avatar_url && c.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.email || 'No email'}</div>
                                </div>
                                <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                            </div>
                            {c.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>{c.bio.slice(0, 120)}{c.bio.length > 120 ? '...' : ''}</p>}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                {(c.platforms || []).map((p: string) => (
                                    <span key={p} className="badge badge-accent">{p}</span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a href={`/creators/${c.id}`} className="btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', fontSize: '13px', padding: '8px 12px' }}>View Profile</a>
                                <button className="btn-secondary" onClick={() => handleDelete(c.id)} style={{ fontSize: '13px', padding: '8px 12px', color: 'var(--danger)' }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
