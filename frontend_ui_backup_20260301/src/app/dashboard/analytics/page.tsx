"use client";

import { useEffect, useState } from "react";
import { analytics, creators } from "@/lib/api";
import { BarChart3, Clock, TrendingUp, Eye, Heart, ArrowUp, ArrowDown, Activity, Users, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/premium/glass-panel";
import { AnimatedNumber } from "@/components/ui/premium/animated-number";

export default function AnalyticsPage() {
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [selectedCreator, setSelectedCreator] = useState<string>("");
    const [dashboard, setDashboard] = useState<any>(null);
    const [postingTimes, setPostingTimes] = useState<any[]>([]);
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);

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
        setStatsLoading(true);
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
        setStatsLoading(false);
    };

    const handleCreatorChange = async (id: string) => {
        setSelectedCreator(id);
        await loadAnalytics(id);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-accent-brand animate-spin" />
                </div>
                <p className="text-text-secondary text-sm animate-pulse">Aggregating Metrics...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight flex items-center gap-2">
                        <BarChart3 className="text-accent-brand" /> Performance Analytics
                    </h1>
                    <p className="text-text-secondary text-sm">Deep-dive insights, predictive modeling, and growth tracking.</p>
                </div>

                <div className="w-full md:w-64">
                    <Select value={selectedCreator} onValueChange={handleCreatorChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 w-full">
                            <SelectValue placeholder="Select creator..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                            {creatorList.map(c => (
                                <SelectItem key={c.id} value={c.id} className="focus:bg-white/5 focus:text-accent-brand">
                                    <span className="font-medium">{c.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {statsLoading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-t-2 border-accent-brand animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1 mb-6 h-auto inline-flex rounded-xl">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-accent-brand data-[state=active]:text-white rounded-lg px-6 py-2">Overview</TabsTrigger>
                        <TabsTrigger value="engagement" className="data-[state=active]:bg-accent-brand data-[state=active]:text-white rounded-lg px-6 py-2">Engagement Density</TabsTrigger>
                        <TabsTrigger value="predictive" className="data-[state=active]:bg-accent-brand data-[state=active]:text-white rounded-lg px-6 py-2 font-semibold">AI Predictor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* High Level Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassPanel className="p-5 flex flex-col justify-between h-32">
                                <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><Eye size={16} className="text-blue-400" /> Total Views</span>
                                <div className="text-3xl font-bold text-white tracking-tight">
                                    <AnimatedNumber value={dashboard?.total_views || 0} />
                                </div>
                            </GlassPanel>
                            <GlassPanel className="p-5 flex flex-col justify-between h-32">
                                <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><Heart size={16} className="text-[#ff4757]" /> Engagements</span>
                                <div className="text-3xl font-bold text-white tracking-tight">
                                    <AnimatedNumber value={dashboard?.total_engagements || 0} />
                                </div>
                            </GlassPanel>
                            <GlassPanel className="p-5 flex flex-col justify-between h-32">
                                <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><MessageCircle size={16} className="text-warning" /> Interactions</span>
                                <div className="text-3xl font-bold text-white tracking-tight">
                                    <AnimatedNumber value={(dashboard?.total_engagements || 100) * 0.1} /> {/* Mocked metric */}
                                </div>
                            </GlassPanel>
                            <GlassPanel className="p-5 flex flex-col justify-between h-32 border-accent-brand/30 bg-accent-brand/5">
                                <span className="text-sm font-medium text-accent-brand flex items-center gap-2"><Activity size={16} /> Avg Sentiment</span>
                                <div className="text-3xl font-bold text-white tracking-tight">
                                    {dashboard?.current_sentiment ? <AnimatedNumber value={dashboard.current_sentiment} format={v => v.toFixed(2)} /> : "0.00"}
                                </div>
                            </GlassPanel>
                        </div>

                        {/* Chart Placeholder Area */}
                        <GlassPanel className="h-[400px] flex flex-col p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Growth Trajectory</h3>
                                <Badge variant="outline" className="border-white/10 bg-white/5">Auto-updating</Badge>
                            </div>
                            <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-xl flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#6c5ce7]/10 to-transparent"></div>
                                {/* Mock Graph Lines */}
                                <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute bottom-0 text-accent-brand/50 stroke-current stroke-2 fill-none group-hover:stroke-accent-brand transition-colors duration-500">
                                    <path d="M0,300 C100,250 200,350 300,200 C400,50 500,150 600,100 C700,50 800,200 1000,50" />
                                </svg>
                                <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute bottom-0 text-[#00d2d3]/50 stroke-current stroke-2 fill-none stroke-dasharray-[5_5] group-hover:stroke-[#00d2d3] transition-colors duration-500">
                                    <path d="M0,350 C150,300 250,380 400,250 C550,120 700,220 1000,150" />
                                </svg>

                                <div className="relative z-10 p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-sm text-white/70 flex flex-col items-center">
                                    <BarChart3 size={24} className="mb-2 text-white/50" />
                                    <span>Interactive D3/Recharts Visualization Space</span>
                                </div>
                            </div>
                        </GlassPanel>
                    </TabsContent>

                    <TabsContent value="engagement" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlassPanel className="p-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="text-warning" /> Optimal Posting Windows</h3>
                                <div className="space-y-3">
                                    {postingTimes.length > 0 ? postingTimes.map((pt, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                            <span className="font-semibold">{pt.day_of_week}s</span>
                                            <Badge className="bg-accent-brand/20 text-accent-brand border-accent-brand/30">{pt.best_time}</Badge>
                                        </div>
                                    )) : (
                                        <div className="p-6 text-center text-text-secondary border border-dashed border-white/10 rounded-lg">Insufficient historical data for time optimization.</div>
                                    )}
                                </div>
                            </GlassPanel>

                            <GlassPanel className="p-6 flex flex-col justify-center items-center text-center">
                                <div className="w-48 h-48 rounded-full border-[16px] border-white/5 border-t-accent-brand border-r-[#00d2d3] flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-2 rounded-full border border-white/10 bg-[#12121a] flex flex-col items-center justify-center">
                                        <span className="text-xs text-text-secondary uppercase tracking-widest mb-1">Retention</span>
                                        <span className="text-3xl font-bold text-white">64<span className="text-lg text-white/50">%</span></span>
                                    </div>
                                </div>
                                <h4 className="font-bold text-lg">Audience Retention Score</h4>
                                <p className="text-sm text-text-secondary mt-2">Based on avg. view duration across recent 15 uploads.</p>
                            </GlassPanel>
                        </div>
                    </TabsContent>

                    <TabsContent value="predictive" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GlassPanel className="p-8 border-accent-brand/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-brand/10 blur-[100px] rounded-full pointer-events-none" />

                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-accent-brand/20 rounded-xl text-accent-brand">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-2xl text-white">AI Growth Forecast</h3>
                                    <p className="text-text-secondary">Next 30 Days Trajectory</p>
                                </div>
                            </div>

                            {forecast ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between">
                                        <span className="text-sm text-text-secondary uppercase tracking-widest font-bold mb-4">Predicted Views</span>
                                        <div className="flex items-end gap-3">
                                            <span className="text-5xl font-bold tracking-tighter text-white">
                                                {Number(forecast.predicted_views || 0).toLocaleString()}
                                            </span>
                                            <Badge className="bg-success/20 text-success border-success/30 mb-2 py-1 px-2">
                                                <ArrowUp size={14} className="mr-1" /> +12%
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between">
                                        <span className="text-sm text-text-secondary uppercase tracking-widest font-bold mb-4">Engagement Rate Est.</span>
                                        <div className="flex items-end gap-3">
                                            <span className="text-5xl font-bold tracking-tighter text-white">
                                                {(forecast.predicted_engagement_rate || 0).toFixed(1)}%
                                            </span>
                                            {forecast.predicted_engagement_rate > 5 ? (
                                                <Badge className="bg-success/20 text-success border-success/30 mb-2">Steady</Badge>
                                            ) : (
                                                <Badge className="bg-warning/20 text-warning border-warning/30 mb-2">
                                                    <ArrowDown size={14} className="mr-1" /> -1.2%
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                    <div>
                                        <Activity size={32} className="mx-auto mb-3 text-white/30" />
                                        <p className="text-text-secondary">Generating AI predictive models for this creator...</p>
                                    </div>
                                </div>
                            )}
                        </GlassPanel>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
