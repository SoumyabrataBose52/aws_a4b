"use client";

import { useEffect, useState } from "react";
import { crisis, creators } from "@/lib/api";
import { ShieldAlert, AlertTriangle, Zap, Brain, Shield, Info, Activity, ArrowRight, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShimmerButton } from "@/components/ui/premium/shimmer-button";
import { GlassPanel } from "@/components/ui/premium/glass-panel";

export default function CrisisPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        creator_id: "", threat_level: "medium", sentiment_drop: 0.3,
        affected_platforms: "instagram", triggering_messages: "",
    });
    const [submitting, setSubmitting] = useState(false);

    // AI Mitigation State
    const [strategizing, setStrategizing] = useState<string | null>(null);
    const [strategies, setStrategies] = useState<Record<string, any[]>>({});
    const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [cl, cr] = await Promise.all([crisis.list(), creators.list()]);
                setList(cl);
                setCreatorList(cr);
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await crisis.create({
                creator_id: formData.creator_id,
                threat_level: formData.threat_level,
                sentiment_drop: formData.sentiment_drop,
                affected_platforms: formData.affected_platforms.split(",").map(p => p.trim()),
                triggering_messages: formData.triggering_messages.split("\n").filter(Boolean),
            });
            setIsDialogOpen(false);
            setFormData({ creator_id: "", threat_level: "medium", sentiment_drop: 0.3, affected_platforms: "instagram", triggering_messages: "" });
            setList(await crisis.list());
        } catch { }
        setSubmitting(false);
    };

    const generateStrats = async (crisisId: string) => {
        if (strategies[crisisId]) {
            setExpandedIncident(expandedIncident === crisisId ? null : crisisId);
            return;
        }

        setStrategizing(crisisId);
        setExpandedIncident(crisisId);
        try {
            const strats = await crisis.generateStrategies(crisisId);
            setStrategies(prev => ({ ...prev, [crisisId]: strats }));
        } catch (e: any) { console.error(e); }
        setStrategizing(null);
    };

    const getThreatConfig = (level: string) => {
        switch (level.toLowerCase()) {
            case "critical": return { color: "text-[#ff4757]", bg: "bg-[#ff4757]/10", border: "border-[#ff4757]/30", icon: <AlertTriangle size={14} className="animate-pulse" />, glow: "shadow-[0_0_15px_rgba(255,71,87,0.3)]" };
            case "high": return { color: "text-[#ffa502]", bg: "bg-[#ffa502]/10", border: "border-[#ffa502]/30", icon: <MessageSquareWarning size={14} /> };
            case "medium": return { color: "text-[#eccc68]", bg: "bg-[#eccc68]/10", border: "border-[#eccc68]/30", icon: <Info size={14} /> };
            case "low": return { color: "text-[#2ed573]", bg: "bg-[#2ed573]/10", border: "border-[#2ed573]/30", icon: <Shield size={14} /> };
            default: return { color: "text-text-secondary", bg: "bg-white/5", border: "border-white/10", icon: <Activity size={14} /> };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-[#ff4757] animate-spin" />
                </div>
                <p className="text-text-secondary text-sm animate-pulse">Loading Incident Matrix...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 flex flex-col gap-6">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight flex items-center gap-2">
                        <ShieldAlert className="text-[#ff4757]" /> Crisis Monitor
                    </h1>
                    <p className="text-text-secondary text-sm">Real-time incident tracking and AI-powered mitigation strategies.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer">
                            <ShimmerButton shimmerColor="#ff4757" background="rgba(255, 71, 87, 0.1)" className="px-5 py-2 border-[#ff4757]/20 hover:border-[#ff4757]/40">
                                <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-[#ff4757] lg:text-base">
                                    <AlertTriangle size={18} /> Report Incident
                                </span>
                            </ShimmerButton>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-[#ff4757]/20 bg-[#12121a]/95 backdrop-blur-3xl text-white">
                        <DialogHeader className="border-b border-white/5 pb-4">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#ff4757]">
                                <ShieldAlert size={20} /> Log New Incident
                            </DialogTitle>
                            <DialogDescription className="text-text-secondary">
                                Alert the system to a potential PR crisis or sentiment drop.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Affected Creator</label>
                                    <Select value={formData.creator_id} onValueChange={(val) => setFormData({ ...formData, creator_id: val })} required>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select creator..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                            {creatorList.map(c => (
                                                <SelectItem key={c.id} value={c.id} className="focus:bg-white/5 focus:text-[#ff4757]">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Threat Level</label>
                                    <Select value={formData.threat_level} onValueChange={(val) => setFormData({ ...formData, threat_level: val })}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                            <SelectItem value="low" className="text-[#2ed573] focus:bg-white/5">Low</SelectItem>
                                            <SelectItem value="medium" className="text-[#eccc68] focus:bg-white/5">Medium</SelectItem>
                                            <SelectItem value="high" className="text-[#ffa502] focus:bg-white/5">High</SelectItem>
                                            <SelectItem value="critical" className="text-[#ff4757] focus:bg-white/5 font-bold">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Sentiment Drop</label>
                                    <Input type="number" step="0.1" required value={formData.sentiment_drop} onChange={e => setFormData({ ...formData, sentiment_drop: Number(e.target.value) })} className="bg-white/5 border-white/10 focus-visible:ring-[#ff4757] text-white" placeholder="e.g. 0.3" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Platforms Affected</label>
                                    <Input required value={formData.affected_platforms} onChange={e => setFormData({ ...formData, affected_platforms: e.target.value })} className="bg-white/5 border-white/10 focus-visible:ring-[#ff4757] text-white" placeholder="twitter, youtube" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Triggering Context / Messages</label>
                                <textarea required value={formData.triggering_messages} onChange={e => setFormData({ ...formData, triggering_messages: e.target.value })} className="w-full h-24 bg-white/5 border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#ff4757] resize-none placeholder:text-white/20 custom-scrollbar" placeholder="- Paste a controversial tweet snippet&#10;- Quote an angry comment..." />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={submitting} className="w-full bg-[#ff4757] hover:bg-[#ff4757]/80 transition-colors text-white font-bold">
                                    {submitting ? "Logging Incident..." : "Register Incident to Grid"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Incident Grid */}
            <div className="grid grid-cols-1 gap-4">
                {list.length === 0 ? (
                    <GlassPanel className="p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10">
                        <Shield size={48} className="text-[#2ed573]/50 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No Active Crises</h3>
                        <p className="text-sm text-text-secondary max-w-sm">System metrics are stable. No creators are currently facing PR incidents.</p>
                    </GlassPanel>
                ) : (
                    list.map((incident) => {
                        const creator = creatorList.find(c => c.id === incident.creator_id);
                        const threat = getThreatConfig(incident.threat_level);
                        const isExpanded = expandedIncident === incident.id;
                        const isStrategizing = strategizing === incident.id;
                        const hasStrategies = !!strategies[incident.id];

                        return (
                            <div key={incident.id} className={`rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-300 ${incident.threat_level === 'critical' ? 'shadow-[0_0_30px_rgba(255,71,87,0.15)] border-[#ff4757]/30' : ''}`}>
                                {/* Incident Header (Always Visible) */}
                                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 bg-white/[0.01]">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 rounded-full p-2 bg-white/5 border ${threat.border} ${threat.color} ${incident.threat_level === 'critical' ? 'animate-pulse' : ''} shrink-0`}>
                                            {threat.icon}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-white">
                                                    {creator?.name || 'Unknown Creator'}
                                                </h3>
                                                <Badge className={`${threat.bg} ${threat.color} ${threat.border} hover:${threat.bg} uppercase tracking-widest text-[10px] font-bold`}>
                                                    {incident.threat_level} THREAT
                                                </Badge>
                                                {incident.sentiment_drop >= 0.5 && (
                                                    <Badge variant="destructive" className="uppercase tracking-widest text-[10px] font-bold">SEVERE DROP</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                                                <span>Platforms: <span className="text-white/80">{incident.affected_platforms?.join(", ")}</span></span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 text-[#ff4757]">
                                                    <Activity size={12} /> -{(incident.sentiment_drop * 100).toFixed(0)}% Sentiment
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => generateStrats(incident.id)}
                                        disabled={isStrategizing}
                                        className={`bg-[#ff4757]/10 border border-[#ff4757]/20 text-[#ff4757] hover:bg-[#ff4757]/20 transition-all ${isExpanded ? 'bg-[#ff4757]/20 ring-1 ring-[#ff4757]/50' : ''}`}
                                    >
                                        {isStrategizing ? (
                                            <><Brain className="mr-2 h-4 w-4 animate-pulse" /> Consulting Nexus AI...</>
                                        ) : hasStrategies ? (
                                            <><Zap className="mr-2 h-4 w-4" /> {isExpanded ? 'Hide Strategy' : 'View Action Plan'}</>
                                        ) : (
                                            <><Brain className="mr-2 h-4 w-4" /> Generate Defense Plan</>
                                        )}
                                    </Button>
                                </div>

                                {/* Expanded Strategy Section */}
                                {isExpanded && hasStrategies && (
                                    <div className="p-0 bg-[#ff4757]/[0.02] border-t border-[#ff4757]/10 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-white/5">

                                            {/* Left Col: Triggers */}
                                            <div className="bg-[#0a0a0f] p-6 lg:col-span-1 border-r border-white/5">
                                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <MessageSquareWarning size={14} className="text-[#ffa502]" /> Detected Triggers
                                                </h4>
                                                <div className="space-y-3">
                                                    {incident.triggering_messages?.map((msg: string, i: number) => (
                                                        <div key={i} className="text-sm p-3 rounded-lg bg-white/[0.03] border border-white/10 text-white/80 italic leading-snug break-words">
                                                            "{msg}"
                                                        </div>
                                                    ))}
                                                    {(!incident.triggering_messages || incident.triggering_messages.length === 0) && (
                                                        <p className="text-sm text-text-secondary italic">No specific messages logged.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Col: AI Mitigation Strategies */}
                                            <div className="bg-[#0a0a0f] p-6 lg:col-span-3">
                                                <h4 className="text-xs font-bold text-accent-brand uppercase tracking-wider flex items-center gap-2 mb-6">
                                                    <Zap size={14} /> AI Recommended Action Plan
                                                </h4>

                                                <div className="space-y-4">
                                                    {strategies[incident.id]?.map((strat: any, idx: number) => (
                                                        <div key={idx} className="p-5 rounded-xl bg-white/[0.02] border border-[#ff4757]/20 hover:border-[#ff4757]/40 transition-colors flex flex-col md:flex-row gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/30 flex items-center justify-center shrink-0 font-bold font-mono">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h5 className="font-bold text-white mb-1 tracking-tight text-[15px]">{strat.action}</h5>
                                                                <p className="text-sm text-white/70 leading-relaxed mb-4">{strat.rationale}</p>

                                                                {strat.draft_message && (
                                                                    <div className="bg-[#12121a] rounded-lg p-4 border border-white/10 mt-2 relative">
                                                                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#12121a] px-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary border border-white/10 rounded-full">
                                                                            Draft Response
                                                                        </div>
                                                                        <p className="text-sm text-white italic whitespace-pre-wrap pt-1">{strat.draft_message}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
