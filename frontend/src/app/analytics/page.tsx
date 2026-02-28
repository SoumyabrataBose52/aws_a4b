'use client';
import { useEffect, useState } from 'react';
import { analytics, creators } from '@/lib/api';

export default function AnalyticsPage() {
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [selectedCreator, setSelectedCreator] = useState<string>('');
    const [dashboard, setDashboard] = useState<any>(null);
    const [postingTimes, setPostingTimes] = useState<any[]>([]);
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const cl = await creators.list();
                setCreatorList(cl);
                if (cl.length > 0) {
                    setSelectedCreator(cl[0].id);
                    await loadAnalytics(cl[0].id);
                }
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const loadAnalytics = async (creatorId: string) => {
        try {
            const [dash, times, fc] = await Promise.all([
                analytics.dashboard(creatorId),
                analytics.postingTimes(creatorId),
                analytics.forecast(creatorId),
            ]);
            setDashboard(dash);
            setPostingTimes(times || []);
            setForecast(fc);
        } catch { }
    };

    const handleCreatorChange = async (id: string) => {
        setSelectedCreator(id);
        setLoading(true);
        await loadAnalytics(id);
        setLoading(false);
    };

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700 }}>📊 Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Performance insights and predictions</p>
                </div>
                <select className="input-dark" style={{ width: '200px' }} value={selectedCreator} onChange={e => handleCreatorChange(e.target.value)}>
                    {creatorList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : !selectedCreator ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Add a creator to see analytics</p>
                </div>
            ) : (
                <>
                    {/* Dashboard Stats */}
                    {dashboard && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div className="stat-card">
                                <div className="stat-label">Total Content</div>
                                <div className="stat-value">{dashboard.total_content || 0}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Active Deals</div>
                                <div className="stat-value">{dashboard.active_deals || 0}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Active Crises</div>
                                <div className="stat-value">{dashboard.active_crises || 0}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Sentiment</div>
                                <div className="stat-value">{(dashboard.current_sentiment || 0).toFixed(1)}</div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Posting Times */}
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>⏰ Best Posting Times</h3>
                            {postingTimes.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No data yet — publish content to build optimization data</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {postingTimes.slice(0, 7).map((t: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '13px', width: '70px' }}>{t.day_name}</span>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '50px' }}>{t.hour}:00</span>
                                            <div style={{ flex: 1, height: '6px', background: 'var(--bg-card)', borderRadius: '3px' }}>
                                                <div style={{ height: '100%', width: `${(t.score || 0) * 100}%`, background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))', borderRadius: '3px' }} />
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>{((t.score || 0) * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Forecast */}
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📈 7-Day Forecast</h3>
                            {!forecast || !forecast.daily_predictions ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Forecast data will appear after more content is published</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(forecast.daily_predictions || []).map((d: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{d.date || `Day ${i + 1}`}</span>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                                                <span>👁️ {(d.predicted_views || 0).toLocaleString()}</span>
                                                <span>❤️ {(d.predicted_likes || 0).toLocaleString()}</span>
                                                <span style={{ color: d.trend === 'up' ? 'var(--success)' : 'var(--danger)' }}>
                                                    {d.trend === 'up' ? '↑' : '↓'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
