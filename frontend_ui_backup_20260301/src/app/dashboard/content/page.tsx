"use client";

import { useEffect, useState } from "react";
import { content, creators } from "@/lib/api";
import { Sparkles, X, FileText, Wand2, Copy, Check, MessageSquare, Instagram, Youtube, Twitter, Linkedin, Loader2, ArrowRight } from "lucide-react";
import { ShimmerButton } from "@/components/ui/premium/shimmer-button";
import { GlassPanel } from "@/components/ui/premium/glass-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ContentPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Generator State
    const [genData, setGenData] = useState({ creator_id: "", topic: "", platforms: "instagram,youtube" });
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [c, cl] = await Promise.all([content.list(), creators.list()]);
                setList(c);
                setCreatorList(cl);
                if (cl.length > 0 && !genData.creator_id) setGenData(p => ({ ...p, creator_id: cl[0].id }));
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
                platforms: genData.platforms.split(",").map(p => p.trim()),
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
        setCopiedContent(platform);
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return <Instagram size={14} className="text-[#E1306C]" />;
            case 'youtube': return <Youtube size={14} className="text-[#FF0000]" />;
            case 'twitter': return <Twitter size={14} className="text-[#1DA1F2]" />;
            case 'linkedin': return <Linkedin size={14} className="text-[#0A66C2]" />;
            default: return <MessageSquare size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-accent-brand animate-spin" />
                </div>
                <p className="text-text-secondary text-sm animate-pulse">Initializing AI Models...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col gap-6">
            <div className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight flex items-center gap-2">
                        <Wand2 className="text-accent-brand" /> AI Workspace
                    </h1>
                    <p className="text-text-secondary text-sm">Generate hyper-personalized, on-brand content streams.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left Column: Generator & Config */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                    <GlassPanel className="p-5 flex flex-col flex-shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-accent-brand/20 flex items-center justify-center">
                                <Sparkles size={16} className="text-accent-brand" />
                            </div>
                            <h2 className="font-semibold text-lg">Content Engine</h2>
                        </div>

                        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Target Creator</label>
                                <Select value={genData.creator_id} onValueChange={(val) => setGenData({ ...genData, creator_id: val })}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                                        <SelectValue placeholder="Select a creator voice..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                        {creatorList.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="focus:bg-white/5 focus:text-accent-brand">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.name}&backgroundColor=6c5ce7`} />
                                                    </Avatar>
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Concept / Topic</label>
                                <textarea
                                    className="w-full h-28 bg-white/5 border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent-brand resize-none placeholder:text-white/20 custom-scrollbar"
                                    placeholder="e.g. My thoughts on the new iPhone 16 Pro camera features..."
                                    value={genData.topic}
                                    onChange={e => setGenData({ ...genData, topic: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Target Platforms</label>
                                <Input
                                    value={genData.platforms}
                                    onChange={e => setGenData({ ...genData, platforms: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white h-11"
                                    placeholder="instagram, youtube, twitter..."
                                />
                                <p className="text-[10px] text-text-secondary">Comma separated platform tags.</p>
                            </div>

                            <ShimmerButton
                                type="submit"
                                disabled={generating || !genData.topic || !genData.creator_id}
                                className="w-full mt-2 h-12"
                                shimmerColor="#ffffff"
                                shimmerDuration="2s"
                            >
                                {generating ? (
                                    <span className="flex items-center gap-2 text-white">
                                        <Loader2 size={16} className="animate-spin" /> Synthesizing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-white font-semibold">
                                        <Wand2 size={16} /> Ignite Generation
                                    </span>
                                )}
                            </ShimmerButton>
                        </form>
                    </GlassPanel>
                </div>

                {/* Right Column: Output Workspace */}
                <div className="lg:col-span-8 flex flex-col h-full bg-[#12121a]/50 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                        <h2 className="font-semibold text-[15px] flex items-center gap-2">
                            <FileText size={16} className="text-text-secondary" /> Workspace Output
                        </h2>
                    </div>

                    <ScrollArea className="flex-1 p-5">
                        {generating ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50 space-y-4 py-20">
                                <div className="w-16 h-16 rounded-2xl border border-accent-brand/30 bg-accent-brand/10 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-accent-brand/20 blur-xl rounded-full" />
                                    <Sparkles size={24} className="text-accent-brand animate-pulse" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <h3 className="font-bold text-white text-lg">AI is dreaming...</h3>
                                    <p className="text-sm">Analyzing creator voice profile and crafting content sequences.</p>
                                </div>
                            </div>
                        ) : genResult ? (
                            genResult.error ? (
                                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                                    <p className="font-bold mb-1">Generation Failed</p>
                                    <p>{genResult.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-gradient-to-r from-transparent via-accent-brand/50 to-transparent flex-1" />
                                        <Badge className="bg-accent-brand/20 text-accent-brand border-accent-brand/30">Successfully Synthesized</Badge>
                                        <div className="h-px bg-gradient-to-r from-accent-brand/50 via-transparent to-transparent flex-1" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(genResult).filter(([k]) => k !== 'topic' && k !== 'creator_id').map(([platform, text]: [string, any]) => (
                                            <GlassPanel key={platform} className="p-5 flex flex-col h-full">
                                                <div className="flex justify-between items-center mb-3">
                                                    <Badge variant="outline" className="bg-white/5 border-white/10 uppercase tracking-widest text-[10px] flex items-center gap-1.5 h-6">
                                                        {getPlatformIcon(platform)} {platform}
                                                    </Badge>
                                                    <button
                                                        onClick={() => handleCopy(text as string, platform)}
                                                        className="text-text-secondary hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
                                                    >
                                                        {copiedContent === platform ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                                <div className="text-sm leading-relaxed text-[#e4e4f0] whitespace-pre-wrap flex-1">
                                                    {text}
                                                </div>
                                            </GlassPanel>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            // Default state showing recent history
                            <div className="space-y-6">
                                {list.length > 0 ? (
                                    <>
                                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Recent Generations</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {list.slice(0, 10).map((item) => (
                                                <div key={item.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-2 group">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarFallback className="bg-white/10 text-[10px]">{item.creator_id?.slice(0, 2) || 'XX'}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm font-medium text-white group-hover:text-accent-brand transition-colors line-clamp-1">{item.topic}</span>
                                                        </div>
                                                        <Badge variant="outline" className="bg-white/5 border-white/5 text-[10px] shrink-0 text-text-secondary">
                                                            <span suppressHydrationWarning>{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50 space-y-3 py-20">
                                        <FileText size={48} className="opacity-20" />
                                        <p>No generation history found. Start creating above!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
