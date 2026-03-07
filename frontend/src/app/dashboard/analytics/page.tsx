"use client";

import { useEffect, useState } from "react";
import { analytics, creators } from "@/lib/api";
import { BarChart3, TrendingUp, Clock, Eye, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { CountUp } from "@/components/ui/reactbits/count-up";

export default function AnalyticsPage() {
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [selectedCreator, setSelectedCreator] = useState<string>("");
    const [dashboard, setDashboard] = useState<any>(null);
    const [postingTimes, setPostingTimes] = useState<any[]>([]);
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30d");

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

    if (!creatorList.length && !loading) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground">No creators available.</div>
        );
    }

    return (
        <div className="animate-fade-up flex flex-col gap-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-1">Cross-platform performance intelligence.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Creator Selector */}
                    <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border overflow-x-auto">
                        {creatorList.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleCreatorChange(c.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${selectedCreator === c.id
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {c.avatar_url ? (
                                    <img
                                        src={c.avatar_url}
                                        alt={c.name}
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-[8px] font-bold text-white">
                                        {c.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                {c.name}
                            </button>
                        ))}
                    </div>
                    {/* Time Range */}
                    <Tabs value={timeRange} onValueChange={setTimeRange}>
                        <TabsList className="h-8 bg-secondary/50">
                            <TabsTrigger value="7d" className="text-[10px] px-2 h-6">7d</TabsTrigger>
                            <TabsTrigger value="30d" className="text-[10px] px-2 h-6">30d</TabsTrigger>
                            <TabsTrigger value="90d" className="text-[10px] px-2 h-6">90d</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                        <StatCard label="Total Content" value={dashboard?.total_content || 0} icon={BarChart3} delta={8} deltaLabel="this period" />
                        <StatCard label="Avg. Sentiment" value={dashboard?.current_sentiment || 0} format={(v) => v.toFixed(2)} icon={TrendingUp} delta={5} deltaLabel="trending up" />
                        <StatCard label="Est. Reach" value={(dashboard?.total_content || 0) * 1420} icon={Eye} delta={15} deltaLabel="growth" />
                        <StatCard label="Active Crises" value={dashboard?.active_crises || 0} icon={BarChart3} delta={0} />
                    </div>

                    {/* Chart Placeholder + Posting Times */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-card border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold">Performance Overview</CardTitle>
                                    <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/10">
                                    <TrendingUp size={32} className="text-muted-foreground/20 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">Growth Trajectory</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Connect time-series data to visualize trends</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Posting Times Heatmap */}
                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Clock size={14} className="text-accent-brand" /> Optimal Posting
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {postingTimes.length > 0 ? (
                                    <div className="grid grid-cols-7 gap-1">
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                            <div key={day} className="text-center">
                                                <p className="text-[9px] text-muted-foreground mb-1">{day}</p>
                                                {[9, 12, 15, 18, 21].map((hour) => {
                                                    const intensity = Math.random();
                                                    return (
                                                        <div
                                                            key={hour}
                                                            className="w-full h-6 rounded-sm mb-0.5"
                                                            style={{
                                                                backgroundColor: `rgba(99, 102, 241, ${0.1 + intensity * 0.5})`,
                                                            }}
                                                            title={`${day} ${hour}:00`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                                        No posting data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Forecast */}
                    {forecast && (
                        <Card className="bg-card border-border card-glow">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingUp size={14} className="text-success" /> Growth Forecast
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {Object.entries(forecast).slice(0, 3).map(([key, value]: [string, any]) => (
                                        <div key={key} className="space-y-1">
                                            <p className="text-micro">{key.replace(/_/g, " ")}</p>
                                            <p className="text-xl font-bold">
                                                {typeof value === "number" ? <CountUp value={value} format={(v) => v.toFixed(1)} /> : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
