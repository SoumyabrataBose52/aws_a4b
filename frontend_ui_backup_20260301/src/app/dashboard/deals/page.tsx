"use client";

import { useEffect, useState } from "react";
import { deals, creators } from "@/lib/api";
import { Handshake, Search, Plus, Activity, Briefcase, IndianRupee, BarChart, ChevronDown, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShimmerButton } from "@/components/ui/premium/shimmer-button";
import { GlassPanel } from "@/components/ui/premium/glass-panel";

export default function DealsPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ creator_id: "", brand_name: "", proposed_rate: 10000, deliverables: "" });
    const [submitting, setSubmitting] = useState(false);

    // AI Research State
    const [researching, setResearching] = useState<string | null>(null);
    const [research, setResearch] = useState<Record<string, any>>({});
    const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [d, cr] = await Promise.all([deals.list(), creators.list()]);
                setList(d);
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
            await deals.create({
                creator_id: formData.creator_id,
                brand_name: formData.brand_name,
                proposed_rate: formData.proposed_rate,
                deliverables: formData.deliverables.split("\n").filter(Boolean),
            });
            setIsDialogOpen(false);
            setFormData({ creator_id: "", brand_name: "", proposed_rate: 10000, deliverables: "" });
            setList(await deals.list());
        } catch { }
        setSubmitting(false);
    };

    const handleResearch = async (dealId: string) => {
        if (research[dealId]) {
            setExpandedDeal(expandedDeal === dealId ? null : dealId);
            return;
        }

        setResearching(dealId);
        setExpandedDeal(dealId);
        try {
            const r = await deals.research(dealId);
            setResearch(prev => ({ ...prev, [dealId]: r }));
        } catch { }
        setResearching(null);
    };

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case "proposed": return { color: "text-accent-brand", bg: "bg-accent-brand/10", border: "border-accent-brand/20", icon: <FileText size={12} /> };
            case "negotiating": return { color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", icon: <Clock size={12} /> };
            case "accepted":
            case "completed": return { color: "text-success", bg: "bg-success/10", border: "border-success/20", icon: <CheckCircle2 size={12} /> };
            case "rejected": return { color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", icon: <XCircle size={12} /> };
            default: return { color: "text-text-secondary", bg: "bg-white/5", border: "border-white/10", icon: <Activity size={12} /> };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-accent-brand animate-spin" />
                </div>
                <p className="text-text-secondary text-sm animate-pulse">Loading Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 flex flex-col gap-6">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight flex items-center gap-2">
                        <Handshake className="text-accent-brand" /> Deal Pipeline
                    </h1>
                    <p className="text-text-secondary text-sm">Track sponsorships, analyze brand alignment, and close deals.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer">
                            <ShimmerButton shimmerColor="#a29bfe" className="px-5 py-2">
                                <span className="flex items-center gap-2 whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white lg:text-lg">
                                    <Plus size={18} /> New Deal Opportunity
                                </span>
                            </ShimmerButton>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-white/10 bg-[#12121a]/95 backdrop-blur-3xl text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Log New Deal</DialogTitle>
                            <DialogDescription className="text-text-secondary">
                                Enter the preliminary details for the sponsorship opportunity.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Creator</label>
                                <Select value={formData.creator_id} onValueChange={(val) => setFormData({ ...formData, creator_id: val })} required>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select attached creator..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                        {creatorList.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="focus:bg-white/5 focus:text-accent-brand">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Brand Name</label>
                                    <Input required value={formData.brand_name} onChange={e => setFormData({ ...formData, brand_name: e.target.value })} className="bg-white/5 border-white/10 focus-visible:ring-accent-brand text-white" placeholder="e.g. Nike, NordVPN" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Proposed Rate (₹)</label>
                                    <div className="relative">
                                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                        <Input type="number" required value={formData.proposed_rate} onChange={e => setFormData({ ...formData, proposed_rate: Number(e.target.value) })} className="pl-8 bg-white/5 border-white/10 focus-visible:ring-accent-brand text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Expected Deliverables</label>
                                <textarea required value={formData.deliverables} onChange={e => setFormData({ ...formData, deliverables: e.target.value })} className="w-full h-24 bg-white/5 border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent-brand resize-none placeholder:text-white/20 custom-scrollbar" placeholder="- 1x 60s Dedicated Integration&#10;- 2x Instagram Stories" />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={submitting} className="w-full bg-accent-brand hover:bg-[#5b4bcf] active:bg-[#4a3ca6] transition-colors text-white">
                                    {submitting ? "Logging Deal..." : "Create Deal Record"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Pipeline Grid */}
            <div className="grid grid-cols-1 gap-4">
                {list.length === 0 ? (
                    <GlassPanel className="p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10">
                        <Briefcase size={48} className="text-text-secondary/30 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No Active Deals</h3>
                        <p className="text-sm text-text-secondary max-w-sm">Your pipeline is empty. Click "New Deal Opportunity" to start tracking sponsorships.</p>
                    </GlassPanel>
                ) : (
                    list.map((deal) => {
                        const creator = creatorList.find(c => c.id === deal.creator_id);
                        const status = getStatusConfig(deal.status);
                        const isExpanded = expandedDeal === deal.id;
                        const isResearching = researching === deal.id;
                        const hasResearch = !!research[deal.id];

                        return (
                            <GlassPanel key={deal.id} className="flex flex-col overflow-hidden transition-all duration-300">
                                {/* Deal Header (Always Visible) */}
                                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 bg-white/[0.01]">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                            <Briefcase size={20} className="text-accent-brand" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                                                {deal.brand_name}
                                                <Badge className={`${status.bg} ${status.color} ${status.border} hover:${status.bg} capitalize`}>
                                                    <span className="flex items-center gap-1.5">{status.icon} {deal.status}</span>
                                                </Badge>
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                <span className="flex items-center gap-1.5">
                                                    <Avatar className="h-4 w-4">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${creator?.name}&backgroundColor=6c5ce7`} />
                                                    </Avatar>
                                                    {creator?.name || 'Unknown'}
                                                </span>
                                                <span>•</span>
                                                <span className="font-mono text-white/80 flex items-center">
                                                    <IndianRupee size={12} className="mr-0.5" />{Number(deal.proposed_rate).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => handleResearch(deal.id)}
                                        disabled={isResearching}
                                        className={`bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-all ${isExpanded ? 'ring-1 ring-accent-brand' : ''}`}
                                    >
                                        {isResearching ? (
                                            <><Activity className="mr-2 h-4 w-4 animate-pulse text-accent-brand" /> AI Analyzing...</>
                                        ) : hasResearch ? (
                                            <><BarChart className="mr-2 h-4 w-4 text-accent-brand" /> {isExpanded ? 'Hide Analysis' : 'View Analysis'}</>
                                        ) : (
                                            <><Activity className="mr-2 h-4 w-4 text-accent-brand" /> Generate AI Analysis</>
                                        )}
                                    </Button>
                                </div>

                                {/* Expanded Research Section */}
                                {isExpanded && hasResearch && (
                                    <div className="p-0 bg-[#0a0a0f]/50 border-t border-white/5 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">

                                            {/* Left Col: Details & Deliverables */}
                                            <div className="bg-[#0a0a0f] p-6 flex flex-col gap-6">
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Deliverables</h4>
                                                    <ul className="space-y-2">
                                                        {deal.deliverables.map((d: string, i: number) => (
                                                            <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                                                <span className="text-accent-brand mt-0.5">•</span> {d}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Deal Sentiment</h4>
                                                    <div className="text-sm text-white flex items-center gap-2">
                                                        <Badge variant="outline" className={`${status.bg} ${status.color} border-white/10`}>
                                                            {research[deal.id].sentiment || "Neutral"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mid Col: Brand Intel */}
                                            <div className="bg-[#0a0a0f] p-6 lg:col-span-2 flex flex-col gap-6">
                                                <h4 className="text-xs font-bold text-accent-brand uppercase tracking-wider flex items-center gap-2">
                                                    <Activity size={14} /> AI Brand Intelligence
                                                </h4>

                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm leading-relaxed text-[#e4e4f0]">
                                                        {research[deal.id].analysis}
                                                    </div>

                                                    {research[deal.id].action_items && research[deal.id].action_items.length > 0 && (
                                                        <div>
                                                            <h5 className="font-semibold text-[13px] text-white mb-2">Recommended Next Steps</h5>
                                                            <div className="space-y-2">
                                                                {research[deal.id].action_items.map((item: string, i: number) => (
                                                                    <div key={i} className="flex gap-3 items-start p-3 bg-white/[0.01] rounded-lg border border-white/5">
                                                                        <div className="w-5 h-5 rounded-full bg-accent-brand/20 text-accent-brand flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
                                                                        <p className="text-sm text-text-secondary">{item}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </GlassPanel>
                        );
                    })
                )}
            </div>
        </div>
    );
}
