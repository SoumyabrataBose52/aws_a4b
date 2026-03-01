"use client";

import { useEffect, useState } from "react";
import { deals, creators } from "@/lib/api";
import { Handshake, Plus, Search, X, DollarSign, Target, BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { CountUp } from "@/components/ui/reactbits/count-up";

export default function DealsPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ creator_id: "", brand_name: "", proposed_rate: 10000, deliverables: "" });
    const [submitting, setSubmitting] = useState(false);
    const [researching, setResearching] = useState<string | null>(null);
    const [research, setResearch] = useState<Record<string, any>>({});
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [d, cr] = await Promise.all([deals.list(), creators.list()]);
                setList(d);
                setCreatorList(cr);
                if (cr.length > 0) setFormData((p) => ({ ...p, creator_id: cr[0].id }));
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
            setDialogOpen(false);
            setList(await deals.list());
        } catch { }
        setSubmitting(false);
    };

    const handleResearch = async (dealId: string) => {
        setResearching(dealId);
        try {
            const r = await deals.research(dealId);
            setResearch((prev) => ({ ...prev, [dealId]: r }));
        } catch { }
        setResearching(null);
    };

    const statusStyles: Record<string, string> = {
        proposed: "bg-accent-brand/15 text-accent-brand border-accent-brand/20",
        negotiating: "bg-warning/15 text-warning border-warning/20",
        accepted: "bg-success/15 text-success border-success/20",
        rejected: "bg-danger/15 text-danger border-danger/20",
        completed: "bg-success/15 text-success border-success/20",
    };

    const totalValue = list.reduce((acc, d) => acc + (d.proposed_rate || 0), 0);
    const filtered = list.filter((d) =>
        d.brand_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="animate-fade-in flex flex-col gap-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-up flex flex-col gap-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Deal Pipeline</h1>
                    <p className="text-sm text-muted-foreground mt-1">Track and negotiate brand partnerships.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
                        <Input
                            placeholder="Search deals..."
                            className="pl-8 h-9 w-full md:w-56 bg-secondary/50 border-border text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-accent-brand hover:bg-accent-brand/90 text-white h-9 gap-1.5">
                                <Plus size={14} /> New Deal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="text-base flex items-center gap-2">
                                    <Handshake size={16} className="text-accent-brand" /> Create New Deal
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Creator</label>
                                        <Select value={formData.creator_id} onValueChange={(v) => setFormData({ ...formData, creator_id: v })}>
                                            <SelectTrigger className="bg-secondary/50 border-border h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {creatorList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Brand Name</label>
                                        <Input className="bg-secondary/50 border-border h-9" required value={formData.brand_name}
                                            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Proposed Rate (₹)</label>
                                    <Input type="number" className="bg-secondary/50 border-border h-9" value={formData.proposed_rate}
                                        onChange={(e) => setFormData({ ...formData, proposed_rate: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Deliverables (one per line)</label>
                                    <textarea className="w-full h-20 bg-secondary/50 border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-brand/50 resize-none"
                                        value={formData.deliverables} onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                                    <Button type="submit" size="sm" disabled={submitting} className="bg-accent-brand hover:bg-accent-brand/90 text-white gap-1.5">
                                        {submitting ? "Creating..." : "Create Deal"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent-brand/10"><Target size={16} className="text-accent-brand" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Active Deals</p>
                            <p className="text-lg font-bold"><CountUp value={list.length} /></p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10"><BarChart size={16} className="text-success" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="text-lg font-bold"><CountUp value={list.filter((d) => d.status === "completed").length} /></p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10"><DollarSign size={16} className="text-warning" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pipeline Value</p>
                            <p className="text-lg font-bold">₹<CountUp value={totalValue} /></p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Deal Cards */}
            {filtered.length === 0 ? (
                <Card className="bg-card border-border">
                    <EmptyState icon={Handshake} title="No deals found" description={search ? "No deals match your search." : "Start tracking brand partnerships to grow revenue."} actionLabel={search ? undefined : "Create Deal"} onAction={() => setDialogOpen(true)} />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                    {filtered.map((d: any) => {
                        const creatorName = creatorList.find((c: any) => c.id === d.creator_id)?.name || "Unknown";
                        return (
                            <Card key={d.id} className="card-glow bg-card border-border group">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-base">{d.brand_name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Creator: {creatorName}</p>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] ${statusStyles[d.status] || "text-muted-foreground"}`}>
                                            {d.status}
                                        </Badge>
                                    </div>
                                    <div className="text-2xl font-bold text-accent-brand mb-3">
                                        ₹{(d.proposed_rate || 0).toLocaleString("en-IN")}
                                    </div>
                                    {(d.deliverables || []).length > 0 && (
                                        <div className="flex gap-1.5 flex-wrap mb-4">
                                            {d.deliverables.map((del: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="text-[10px]">{del}</Badge>
                                            ))}
                                        </div>
                                    )}
                                    {research[d.id] && (
                                        <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 mb-4 text-xs space-y-1">
                                            <p className="font-semibold text-accent-brand text-[11px]">Market Research</p>
                                            <p>Industry: {research[d.id].brand_industry}</p>
                                            <p>Rates: ₹{research[d.id].suggested_rates?.percentile25?.toLocaleString()} - ₹{research[d.id].suggested_rates?.percentile75?.toLocaleString()}</p>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5" onClick={() => handleResearch(d.id)} disabled={researching === d.id}>
                                        <Search size={12} /> {researching === d.id ? "Researching..." : "Research Brand"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
