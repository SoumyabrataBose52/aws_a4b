'use client';
import { useState, useEffect } from 'react';
import { pipeline, instagram, youtube } from '@/lib/api';
import { Activity, Instagram, Youtube, Sparkles, Loader2, ArrowRight, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PipelineInsightsPage() {
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [youtubeId, setYoutubeId] = useState('');
    const [instagramId, setInstagramId] = useState('');
    const [instagramToken, setInstagramToken] = useState('');
    const [insights, setInsights] = useState<any>(null);
    const [error, setError] = useState('');

    const runAnalysis = async () => {
        if (!youtubeId && !instagramId) {
            setError('Please provide at least one channel/user ID');
            return;
        }
        setAnalyzing(true);
        setError('');
        setInsights(null);
        try {
            const result = await pipeline.analyze({
                youtube_channel_id: youtubeId || undefined,
                instagram_user_id: instagramId || undefined,
                instagram_token: instagramToken || undefined,
                max_items: 20
            });
            setInsights(result.gemini_insights);
        } catch (e: any) {
            setError(e.message || 'Pipeline analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-up">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Activity className="w-8 h-8 text-accent-brand" />
                    Cross-Platform Insights
                </h1>
                <p className="text-zinc-400 mt-1">Unified analytics and Gemini AI driven strategies for YouTube and Instagram.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Configuration */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <BarChart size={14} className="text-accent-brand" /> Data Sources
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Youtube className="w-4 h-4 text-red-500" /> YouTube Channel ID
                                </label>
                                <Input
                                    className="bg-secondary/50 border-border text-sm"
                                    placeholder="e.g., UCx..."
                                    value={youtubeId}
                                    onChange={(e) => setYoutubeId(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Instagram className="w-4 h-4 text-pink-500" /> Instagram User ID
                                </label>
                                <Input
                                    className="bg-secondary/50 border-border text-sm"
                                    placeholder="e.g., 178414..."
                                    value={instagramId}
                                    onChange={(e) => setInstagramId(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Instagram className="w-4 h-4 text-pink-500" /> Instagram Access Token
                                </label>
                                <Input
                                    className="bg-secondary/50 border-border text-sm"
                                    type="password"
                                    placeholder="Long-lived token..."
                                    value={instagramToken}
                                    onChange={(e) => setInstagramToken(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={runAnalysis}
                                disabled={analyzing || (!youtubeId && !instagramId)}
                                className="w-full bg-accent-brand hover:bg-accent-brand/90 text-white mt-4"
                            >
                                {analyzing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                                {analyzing ? "Analyzing Pipeline..." : "Generate AI Insights"}
                            </Button>
                            {error && <p className="text-xs text-danger mt-2">{error}</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Insights Display */}
                <div className="lg:col-span-8 space-y-6">
                    {analyzing ? (
                        <div className="h-64 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-zinc-400">
                            <Loader2 className="w-8 h-8 animate-spin text-accent-brand mb-4" />
                            <p className="font-medium text-white">Synthesizing cross-platform data...</p>
                            <p className="text-xs mt-1">Feeding unified metrics to Gemini AI</p>
                        </div>
                    ) : insights ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Executive Summary */}
                            <Card className="bg-card border-border overflow-hidden">
                                <div className="bg-gradient-to-r from-accent-brand/20 to-transparent p-6 border-b border-border">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                                        <Sparkles className="w-5 h-5 text-accent-brand" /> Executive Summary
                                    </h2>
                                    <p className="text-zinc-300 text-sm leading-relaxed">{insights.executive_summary}</p>
                                </div>
                            </Card>

                            {/* Grid for other sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Content Strategy */}
                                <Card className="bg-card border-border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                                            Content Strategy
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {insights.content_strategy?.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                                                    <ArrowRight className="w-4 h-4 text-accent-brand shrink-0 mt-0.5" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Audience Analysis */}
                                <Card className="bg-card border-border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                                            Audience Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {insights.audience_analysis?.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                                                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Actionable Recommendations */}
                                <Card className="col-span-1 md:col-span-2 bg-card border-border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                                            Actionable Recommendations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {insights.actionable_recommendations?.map((rec: string, i: number) => (
                                                <div key={i} className="p-4 rounded-xl bg-secondary/50 border border-border/50 flex flex-col justify-center h-full">
                                                    <p className="text-sm text-white leading-snug">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center text-zinc-500">
                            <BarChart className="w-12 h-12 mb-4 opacity-50" />
                            <p>Enter your channel IDs and click Generate</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
