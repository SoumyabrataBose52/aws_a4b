'use client';
import { useEffect, useState } from 'react';
import { analytics, creators } from '@/lib/api';
import { BarChart3, Clock, TrendingUp, Eye, Heart, ArrowUp, ArrowDown } from 'lucide-react';

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
            <div className="flex justify-between items-center mb-7">
                <div>
                    <h1 className="text-[28px] font-bold flex items-center gap-2">
                        <BarChart3 size={24} className="text-accent" /> Analytics
                    </h1>
                    <p className="text-text-secondary text-sm">Performance insights and predictions</p>
                </div>
                <select className="input-dark w-[200px]" value={selectedCreator} onChange={e => handleCreatorChange(e.target.value)}>
                    {creatorList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : !selectedCreator ? (
                <div className="glass-card text-center py-16">
                    <p className="text-text-secondary">Add a creator to see analytics</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    {dashboard && (
                        <div className="grid grid-cols-4 gap-4 mb-6">
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

                    <div className="grid grid-cols-2 gap-5">
                        {/* Posting Times */}
                        <div className="glass-card p-5">
                            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                                <Clock size={16} className="text-accent" /> Best Posting Times
                            </h3>
                            {postingTimes.length === 0 ? (
                                <p className="text-text-secondary text-sm">No data yet — publish content to build optimization data</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {postingTimes.slice(0, 7).map((t: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-bg-secondary rounded-lg">
                                            <span className="font-semibold text-[13px] w-[70px]">{t.day_name}</span>
                                            <span className="text-[13px] text-text-secondary w-[50px]">{t.hour}:00</span>
                                            <div className="flex-1 h-1.5 bg-bg-card rounded-full">
                                                <div className="h-full bg-gradient-to-r from-gradient-start to-gradient-end rounded-full transition-all"
                                                    style={{ width: `${(t.score || 0) * 100}%` }} />
                                            </div>
                                            <span className="text-xs text-accent font-semibold">{((t.score || 0) * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Forecast */}
                        <div className="glass-card p-5">
                            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-accent" /> 7-Day Forecast
                            </h3>
                            {!forecast || !forecast.daily_predictions ? (
                                <p className="text-text-secondary text-sm">Forecast data will appear after more content is published</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {(forecast.daily_predictions || []).map((d: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-2.5 bg-bg-secondary rounded-lg">
                                            <span className="text-[13px] font-medium">{d.date || `Day ${i + 1}`}</span>
                                            <div className="flex gap-4 text-xs">
                                                <span className="flex items-center gap-1"><Eye size={12} /> {(d.predicted_views || 0).toLocaleString()}</span>
                                                <span className="flex items-center gap-1"><Heart size={12} /> {(d.predicted_likes || 0).toLocaleString()}</span>
                                                <span className={d.trend === 'up' ? 'text-success' : 'text-danger'}>
                                                    {d.trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
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
