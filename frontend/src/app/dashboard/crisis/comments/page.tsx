"use client";

import { useState, useEffect, useRef } from "react";
import { crisis, creators } from "@/lib/api";
import {
    Search, BarChart3, MessageSquareWarning, Sparkles, AlertTriangle,
    TrendingDown, TrendingUp, Minus, ArrowLeft, Loader2, Tag, Brain,
    Clock, ChevronDown, ChevronUp, ExternalLink, History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

/* ────── types ────── */
interface AnalysisResult {
    id: string | null;
    video_id: string;
    creator_id?: string | null;
    total_comments: number;
    avg_sentiment: number;
    sentiment_distribution: Record<string, number>;
    most_negative: { text: string; score: number; label: string }[];
    most_positive: { text: string; score: number; label: string }[];
    anomaly_detected: boolean;
    anomaly_message?: string | null;
    keywords: { crisis: string[]; positive: string[]; trending: string[] };
    alerts: { severity: string; message: string; keyword?: string }[];
    time_intervals: {
        interval_index: number; start: string; end: string;
        comment_count: number; avg_score: number; min_score: number; max_score: number;
    }[];
    gemini_summary: string;
    comments: {
        comment_id: string; author: string; text: string; likes: number;
        published_at: string; sentiment_score: number; sentiment_label: string;
        confidence: number; star_rating: number;
    }[];
    analyzed_at: string;
}

interface PastAnalysis {
    id: string;
    video_id: string;
    total_comments: number;
    avg_sentiment: number;
    gemini_summary?: string | null;
    analyzed_at: string;
}

/* ────── helpers ────── */
function extractVideoId(input: string): string {
    const trimmed = input.trim();
    // Handle full URLs
    try {
        const url = new URL(trimmed);
        if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
            if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
            return url.searchParams.get("v") || trimmed;
        }
    } catch { }
    // Already an ID
    return trimmed;
}

function sentimentColor(score: number) {
    if (score >= 0.5) return "text-emerald-400";
    if (score >= 0.1) return "text-emerald-300/70";
    if (score >= -0.1) return "text-zinc-400";
    if (score >= -0.5) return "text-amber-400";
    return "text-red-400";
}

function sentimentBg(score: number) {
    if (score >= 0.5) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 0.1) return "bg-emerald-500/10 border-emerald-500/20";
    if (score >= -0.1) return "bg-zinc-500/10 border-zinc-500/20";
    if (score >= -0.5) return "bg-amber-500/15 border-amber-500/25";
    return "bg-red-500/15 border-red-500/25";
}

function sentimentBarColor(score: number) {
    if (score >= 0.5) return "bg-emerald-400";
    if (score >= 0.1) return "bg-emerald-300/60";
    if (score >= -0.1) return "bg-zinc-500";
    if (score >= -0.5) return "bg-amber-400";
    return "bg-red-400";
}

function sentimentIcon(score: number) {
    if (score >= 0.1) return <TrendingUp size={14} className="text-emerald-400" />;
    if (score <= -0.1) return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-zinc-400" />;
}

function severityStyle(severity: string) {
    switch (severity) {
        case "critical": return "bg-red-500/15 text-red-400 border-red-500/25";
        case "warning": return "bg-amber-500/15 text-amber-400 border-amber-500/25";
        default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
}

/* ━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━ */
export default function CommentAnalysisPage() {
    const [videoInput, setVideoInput] = useState("");
    const [maxComments, setMaxComments] = useState(100);
    const [intervalSec, setIntervalSec] = useState(30);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([]);
    const [showPast, setShowPast] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [selectedCreatorId, setSelectedCreatorId] = useState("");

    useEffect(() => {
        async function loadInit() {
            try {
                const [past, crs] = await Promise.all([
                    crisis.listAnalyses(),
                    creators.list(),
                ]);
                setPastAnalyses(past);
                setCreatorList(crs);
            } catch { }
        }
        loadInit();
    }, []);

    const handleAnalyze = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const vid = extractVideoId(videoInput);
        if (!vid) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const res = await crisis.analyzeComments({
                video_id: vid,
                creator_id: selectedCreatorId || undefined,
                interval_seconds: intervalSec,
                max_comments: maxComments,
            });
            setResult(res);
            // Refresh past list
            try { setPastAnalyses(await crisis.listAnalyses()); } catch { }
        } catch (err: any) {
            setError(err.message || "Analysis failed");
        }
        setAnalyzing(false);
    };

    const loadPastAnalysis = async (id: string) => {
        setAnalyzing(true);
        setError(null);
        try {
            const res = await crisis.getAnalysis(id);
            setResult(res);
            setShowPast(false);
        } catch (err: any) {
            setError(err.message || "Failed to load analysis");
        }
        setAnalyzing(false);
    };

    const displayedComments = showAllComments
        ? (result?.comments || [])
        : (result?.comments || []).slice(0, 20);

    return (
        <div className="animate-fade-up flex flex-col gap-6 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <Link href="/dashboard/crisis" className="text-xs text-muted-foreground hover:text-accent-brand flex items-center gap-1 mb-2 transition-colors">
                        <ArrowLeft size={12} /> Back to Crisis Monitor
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <MessageSquareWarning size={22} className="text-accent-brand" />
                        Live Comment Analysis
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sentiment analysis on YouTube comments using pretrained transformers + Gemini AI.
                    </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowPast(!showPast)}>
                    <History size={12} />
                    {showPast ? "Hide" : "Past Analyses"} ({pastAnalyses.length})
                </Button>
            </div>

            {/* Past Analyses Dropdown */}
            {showPast && pastAnalyses.length > 0 && (
                <Card className="bg-card border-border noise-card animate-fade-in">
                    <CardContent className="p-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Analysis Runs</p>
                        {pastAnalyses.slice(0, 10).map((pa) => (
                            <button key={pa.id} onClick={() => loadPastAnalysis(pa.id)}
                                className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-accent-brand/30 transition-all">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-mono">{pa.video_id}</Badge>
                                        <span className={`text-xs font-semibold ${sentimentColor(pa.avg_sentiment)}`}>
                                            {pa.avg_sentiment >= 0 ? "+" : ""}{pa.avg_sentiment.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {pa.total_comments} comments · {new Date(pa.analyzed_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {pa.gemini_summary && (
                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{pa.gemini_summary}</p>
                                )}
                            </button>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Input Form */}
            <Card className="bg-card border-border noise-card">
                <CardContent className="p-5">
                    <form onSubmit={handleAnalyze} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">YouTube Video URL or ID</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="bg-secondary/50 border-border h-10 pl-9 text-sm font-mono"
                                        placeholder="https://youtube.com/watch?v=... or video ID"
                                        value={videoInput}
                                        onChange={(e) => setVideoInput(e.target.value)}
                                        disabled={analyzing}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Max Comments</label>
                                <Input type="number" min={10} max={500} step={10} className="bg-secondary/50 border-border h-9 w-28 text-sm"
                                    value={maxComments} onChange={(e) => setMaxComments(Number(e.target.value))} disabled={analyzing} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Interval (sec)</label>
                                <Input type="number" min={5} max={3600} step={5} className="bg-secondary/50 border-border h-9 w-28 text-sm"
                                    value={intervalSec} onChange={(e) => setIntervalSec(Number(e.target.value))} disabled={analyzing} />
                            </div>
                            {creatorList.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Link to Creator (optional)</label>
                                    <select className="bg-secondary/50 border border-border rounded-md h-9 px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                                        value={selectedCreatorId} onChange={(e) => setSelectedCreatorId(e.target.value)} disabled={analyzing}>
                                        <option value="">— None —</option>
                                        {creatorList.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                            )}
                            <Button type="submit" size="sm" disabled={analyzing || !videoInput.trim()}
                                className="bg-accent-brand hover:bg-accent-brand/90 text-white h-9 gap-1.5 px-5">
                                {analyzing ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Sparkles size={14} /> Analyze Comments</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Loading */}
            {analyzing && !result && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-brand/5 border border-accent-brand/20">
                        <Loader2 size={18} className="text-accent-brand animate-spin" />
                        <div>
                            <p className="text-sm font-medium">Processing live comment flow…</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Fetching comments → Transformer sentiment scoring → Gemini keyword extraction</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
                    </div>
                    <Skeleton className="h-48 rounded-lg" />
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-5 animate-fade-up stagger-children">

                    {/* ── Alerts Banner ── */}
                    {result.alerts.length > 0 && (
                        <div className="space-y-2">
                            {result.alerts.map((alert, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${severityStyle(alert.severity)} ${alert.severity === "critical" ? "animate-pulse-soft" : ""}`}>
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${severityStyle(alert.severity)}`}>
                                                {alert.severity}
                                            </Badge>
                                            {alert.keyword && <Badge variant="secondary" className="text-[9px]">{alert.keyword}</Badge>}
                                        </div>
                                        <p className="text-xs leading-relaxed">{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="bg-card border-border noise-card">
                            <CardContent className="p-4 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Sentiment</p>
                                <p className={`text-2xl font-bold ${sentimentColor(result.avg_sentiment)}`}>
                                    {result.avg_sentiment >= 0 ? "+" : ""}{result.avg_sentiment.toFixed(2)}
                                </p>
                                <div className="mt-1">{sentimentIcon(result.avg_sentiment)}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card border-border noise-card">
                            <CardContent className="p-4 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Comments</p>
                                <p className="text-2xl font-bold">{result.total_comments}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{result.time_intervals.length} intervals</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card border-border noise-card">
                            <CardContent className="p-4 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Positive</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {((result.sentiment_distribution.positive || 0) + (result.sentiment_distribution.very_positive || 0)).toFixed(0)}%
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card border-border noise-card">
                            <CardContent className="p-4 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Negative</p>
                                <p className="text-2xl font-bold text-red-400">
                                    {((result.sentiment_distribution.negative || 0) + (result.sentiment_distribution.very_negative || 0)).toFixed(0)}%
                                </p>
                                {result.anomaly_detected && (
                                    <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20 mt-1">ANOMALY</Badge>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Sentiment Timeline ── */}
                    {result.time_intervals.length > 0 && (
                        <Card className="bg-card border-border noise-card">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <BarChart3 size={14} className="text-accent-brand" /> Sentiment Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-2">
                                <div className="flex items-end gap-[3px] h-32">
                                    {result.time_intervals.map((iv, i) => {
                                        const normalized = (iv.avg_score + 1) / 2; // 0..1
                                        const heightPct = Math.max(normalized * 100, 4);
                                        return (
                                            <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                                                <div
                                                    className={`w-full rounded-sm transition-all ${sentimentBarColor(iv.avg_score)} hover:opacity-80`}
                                                    style={{ height: `${heightPct}%`, minHeight: "4px" }}
                                                />
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-[10px] hidden group-hover:block z-20 whitespace-nowrap shadow-xl">
                                                    <p className="font-semibold">Interval {iv.interval_index + 1}</p>
                                                    <p className={sentimentColor(iv.avg_score)}>Avg: {iv.avg_score.toFixed(2)}</p>
                                                    <p className="text-muted-foreground">{iv.comment_count} comments</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
                                    <span>Earliest</span>
                                    <span>Latest</span>
                                </div>
                                {/* Sentiment distribution bar */}
                                <div className="mt-4 flex rounded-full overflow-hidden h-2.5 bg-secondary/50">
                                    <div className="bg-emerald-400" style={{ width: `${(result.sentiment_distribution.very_positive || 0)}%` }} />
                                    <div className="bg-emerald-300/60" style={{ width: `${(result.sentiment_distribution.positive || 0)}%` }} />
                                    <div className="bg-zinc-500" style={{ width: `${(result.sentiment_distribution.neutral || 0)}%` }} />
                                    <div className="bg-amber-400" style={{ width: `${(result.sentiment_distribution.negative || 0)}%` }} />
                                    <div className="bg-red-400" style={{ width: `${(result.sentiment_distribution.very_negative || 0)}%` }} />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[9px]">
                                    <span className="text-emerald-400">Very Positive {(result.sentiment_distribution.very_positive || 0).toFixed(0)}%</span>
                                    <span className="text-zinc-400">Neutral {(result.sentiment_distribution.neutral || 0).toFixed(0)}%</span>
                                    <span className="text-red-400">Very Negative {(result.sentiment_distribution.very_negative || 0).toFixed(0)}%</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Two-Column: Keywords + Gemini Summary ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Keywords Panel */}
                        <Card className="bg-card border-border noise-card">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Tag size={14} className="text-accent-brand" /> Extracted Keywords
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-2 space-y-3">
                                {result.keywords.crisis?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1.5 font-semibold">🚨 Crisis Keywords</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.keywords.crisis.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">{kw}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {result.keywords.positive?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1.5 font-semibold">✅ Positive Keywords</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.keywords.positive.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{kw}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {result.keywords.trending?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-accent-brand mb-1.5 font-semibold">🔥 Trending Topics</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {result.keywords.trending.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] bg-accent-brand/10 text-accent-brand border-accent-brand/20">{kw}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(!result.keywords.crisis?.length && !result.keywords.positive?.length && !result.keywords.trending?.length) && (
                                    <p className="text-xs text-muted-foreground">No keywords extracted.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Gemini Summary */}
                        <Card className="bg-card border-border noise-card">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Brain size={14} className="text-accent-violet" /> Gemini AI Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-2">
                                <div className="p-4 rounded-lg bg-gradient-to-br from-accent-brand/5 to-accent-violet/5 border border-accent-brand/10">
                                    <p className="text-sm leading-relaxed text-foreground/90">{result.gemini_summary}</p>
                                </div>
                                {result.anomaly_detected && result.anomaly_message && (
                                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <p className="text-xs text-red-400 flex items-center gap-1.5">
                                            <AlertTriangle size={12} /> {result.anomaly_message}
                                        </p>
                                    </div>
                                )}
                                <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock size={10} />
                                    Analyzed at {result.analyzed_at ? new Date(result.analyzed_at).toLocaleString() : "—"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Comment Feed ── */}
                    {result.comments.length > 0 && (
                        <Card className="bg-card border-border noise-card">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <MessageSquareWarning size={14} className="text-accent-brand" />
                                        Comment Feed ({result.comments.length})
                                    </span>
                                    <div className="flex gap-1.5 text-[9px]">
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{((result.sentiment_distribution.positive || 0) + (result.sentiment_distribution.very_positive || 0)).toFixed(0)}% positive</Badge>
                                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">{((result.sentiment_distribution.negative || 0) + (result.sentiment_distribution.very_negative || 0)).toFixed(0)}% negative</Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-2 space-y-2">
                                {displayedComments.map((c, i) => (
                                    <div key={i} className={`p-3 rounded-lg border transition-all hover:bg-secondary/20 ${sentimentBg(c.sentiment_score)}`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                                    {c.author.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-medium">{c.author}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`text-[9px] ${sentimentBg(c.sentiment_score)}`}>
                                                    {c.sentiment_label.replace("_", " ")} ({c.sentiment_score >= 0 ? "+" : ""}{c.sentiment_score.toFixed(1)})
                                                </Badge>
                                                <span className="text-[9px] text-muted-foreground">★{c.star_rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-foreground/80 leading-relaxed">{c.text}</p>
                                        {c.likes > 0 && (
                                            <p className="text-[10px] text-muted-foreground mt-1">👍 {c.likes}</p>
                                        )}
                                    </div>
                                ))}
                                {result.comments.length > 20 && (
                                    <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-2"
                                        onClick={() => setShowAllComments(!showAllComments)}>
                                        {showAllComments
                                            ? <><ChevronUp size={12} /> Show Less</>
                                            : <><ChevronDown size={12} /> Show All {result.comments.length} Comments</>
                                        }
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!result && !analyzing && !error && (
                <Card className="bg-card border-border noise-card">
                    <CardContent className="p-12 text-center">
                        <div className="w-14 h-14 rounded-full bg-accent-brand/10 flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={24} className="text-accent-brand" />
                        </div>
                        <h3 className="text-base font-semibold mb-1">Analyze Video Comments</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Paste a YouTube video URL or ID above to run real-time sentiment analysis
                            using pretrained BERT transformers with Gemini-powered keyword extraction and alerting.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
