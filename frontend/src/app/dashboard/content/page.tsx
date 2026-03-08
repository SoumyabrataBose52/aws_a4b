"use client";

import { useEffect, useState } from "react";
import { content, creators } from "@/lib/api";
import { Sparkles, FileText, Copy, Check, Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { BrainCircuit } from "lucide-react";

export default function ContentPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [genData, setGenData] = useState({ creator_id: "", topic: "", platforms: "instagram,youtube" });
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [c, cl] = await Promise.all([content.list(), creators.list()]);
                setList(c);
                setCreatorList(cl);
                if (cl.length > 0 && !genData.creator_id) setGenData((p) => ({ ...p, creator_id: cl[0].id }));
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!genData.topic.trim()) return;
        setGenerating(true);
        setGenResult(null);
        try {
            const result = await content.generate({
                creator_id: genData.creator_id,
                topic: genData.topic,
                platforms: genData.platforms.split(",").map((p) => p.trim()),
            });
            setGenResult(result);
            setList(await content.list());
        } catch (e: any) {
            setGenResult({ error: e.message });
        }
        setGenerating(false);
    };

    const handleCopy = (text: string, platform: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
    };

    if (loading) {
        return (
            <div className="animate-fade-in flex flex-col gap-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Skeleton className="h-96 lg:col-span-4" />
                    <Skeleton className="h-96 lg:col-span-8" />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-up flex flex-col gap-6 max-w-7xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Content Engine</h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">AI-powered multi-platform content generation.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left — Generator */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles size={14} className="text-accent-brand" /> Generator
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] bg-secondary/50 font-normal">
                                <BrainCircuit size={10} className="mr-1 text-accent-brand" /> Claude Sonnet/Opus 4.6
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Creator Voice</label>
                                    <Select value={genData.creator_id} onValueChange={(v) => setGenData({ ...genData, creator_id: v })}>
                                        <SelectTrigger className="bg-secondary/50 border-border h-9">
                                            <SelectValue placeholder="Select creator..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {creatorList.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Topic / Brief</label>
                                    <textarea
                                        className="w-full h-28 bg-secondary/50 border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-brand/50 focus:border-accent-brand resize-none"
                                        placeholder="Describe the content topic..."
                                        value={genData.topic}
                                        onChange={(e) => setGenData({ ...genData, topic: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Target Platforms</label>
                                    <Input
                                        value={genData.platforms}
                                        onChange={(e) => setGenData({ ...genData, platforms: e.target.value })}
                                        className="bg-secondary/50 border-border h-9 text-sm"
                                        placeholder="instagram, youtube, twitter..."
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={generating || !genData.topic || !genData.creator_id}
                                    className="w-full bg-accent-brand hover:bg-accent-brand/90 text-white h-9 gap-2"
                                >
                                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    {generating ? "Generating..." : "Generate Drafts"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Recent History */}
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Clock size={12} /> Recent
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {list.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className="px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                                        onClick={() => setGenResult({ content: item, style_match_score: item.confidence_score || 0.85 })}
                                    >
                                        <p className="text-sm font-medium line-clamp-1">{item.topic || item.text?.slice(0, 50)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-[9px]">{item.status || "draft"}</Badge>
                                            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                                {new Date(item.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {list.length === 0 && (
                                    <div className="p-6 text-center text-xs text-muted-foreground">No content generated yet.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Output Workspace */}
                <Card className="lg:col-span-8 bg-card border-border flex flex-col">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-muted-foreground" />
                            <CardTitle className="text-sm font-semibold">Output Workspace</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        {generating ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground space-y-3">
                                <div className="relative">
                                    <Loader2 size={28} className="animate-spin text-accent-brand" />
                                    <div className="absolute inset-0 animate-ping">
                                        <Loader2 size={28} className="text-accent-brand/20" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium">Synthesizing drafts...</p>
                                <p className="text-xs text-muted-foreground">This may take a moment</p>
                            </div>
                        ) : genResult ? (
                            genResult.error ? (
                                <div className="p-6">
                                    <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                                        <p className="font-semibold mb-1">Generation Failed</p>
                                        <p className="text-xs opacity-80">{genResult.error}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-6 animate-fade-up">
                                    {genResult.content && (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap justify-between items-center gap-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {genResult.content.platforms?.map((platform: string) => (
                                                        <Badge key={platform} variant="outline" className="text-xs uppercase tracking-wider text-accent-brand border-accent-brand/30">
                                                            {platform}
                                                        </Badge>
                                                    ))}
                                                    {genResult.style_match_score && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Score: {(genResult.style_match_score * 100).toFixed(0)}%
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-muted-foreground gap-1.5"
                                                    onClick={() => handleCopy(genResult.content.text, "all")}
                                                >
                                                    {copiedPlatform === "all" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                                    {copiedPlatform === "all" ? "Copied!" : "Copy"}
                                                </Button>
                                            </div>
                                            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                                {genResult.content.text}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                                <div className="p-4 rounded-2xl bg-accent-brand/5 border border-accent-brand/10 mb-4">
                                    <Sparkles size={28} className="text-accent-brand/30" />
                                </div>
                                <p className="text-sm font-medium">Ready to generate</p>
                                <p className="text-xs text-muted-foreground mt-1">Configure the generator on the left and hit generate.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
