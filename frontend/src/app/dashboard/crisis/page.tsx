"use client";

import { useEffect, useState } from "react";
import { crisis, creators } from "@/lib/api";
import { Shield, AlertTriangle, Zap, Brain, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export default function CrisisPage() {
    const [list, setList] = useState<any[]>([]);
    const [creatorList, setCreatorList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        creator_id: "", threat_level: "medium", sentiment_drop: 0.3,
        affected_platforms: "instagram", triggering_messages: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [strategizing, setStrategizing] = useState<string | null>(null);
    const [strategies, setStrategies] = useState<Record<string, any[]>>({});

    useEffect(() => {
        async function load() {
            try {
                const [cl, cr] = await Promise.all([crisis.list(), creators.list()]);
                setList(cl);
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
            await crisis.create({
                creator_id: formData.creator_id,
                threat_level: formData.threat_level,
                sentiment_drop: formData.sentiment_drop,
                affected_platforms: formData.affected_platforms.split(",").map((p) => p.trim()),
                triggering_messages: formData.triggering_messages.split("\n").filter(Boolean),
            });
            setDialogOpen(false);
            setList(await crisis.list());
        } catch { }
        setSubmitting(false);
    };

    const generateStrats = async (crisisId: string) => {
        setStrategizing(crisisId);
        try {
            const strats = await crisis.generateStrategies(crisisId);
            setStrategies((prev) => ({ ...prev, [crisisId]: strats }));
        } catch (e: any) { console.error(e); }
        setStrategizing(null);
    };

    const severityClass: Record<string, string> = {
        critical: "severity-critical", high: "severity-high",
        medium: "severity-medium", low: "severity-low",
    };
    const severityBadge: Record<string, string> = {
        critical: "bg-danger/15 text-danger border-danger/20",
        high: "bg-danger/15 text-danger border-danger/20",
        medium: "bg-warning/15 text-warning border-warning/20",
        low: "bg-success/15 text-success border-success/20",
    };

    const activeCrises = list.filter((c) => c.status === "active");

    if (loading) {
        return (
            <div className="animate-fade-in flex flex-col gap-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-16 rounded-lg" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-up flex flex-col gap-6 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Crisis Monitor
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time sentiment monitoring and PR risk management.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-danger hover:bg-danger/90 text-white h-9 gap-1.5">
                            <AlertTriangle size={14} /> Report Crisis
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-base flex items-center gap-2">
                                <AlertTriangle size={16} className="text-danger" /> Report New Crisis
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
                                    <label className="text-xs font-medium text-muted-foreground">Threat Level</label>
                                    <Select value={formData.threat_level} onValueChange={(v) => setFormData({ ...formData, threat_level: v })}>
                                        <SelectTrigger className="bg-secondary/50 border-border h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Affected Platforms</label>
                                    <Input className="bg-secondary/50 border-border h-9 text-sm" value={formData.affected_platforms}
                                        onChange={(e) => setFormData({ ...formData, affected_platforms: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Sentiment Drop (0-1)</label>
                                    <Input type="number" step="0.1" min="0" max="1" className="bg-secondary/50 border-border h-9 text-sm"
                                        value={formData.sentiment_drop} onChange={(e) => setFormData({ ...formData, sentiment_drop: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Triggering Messages</label>
                                <textarea className="w-full h-20 bg-secondary/50 border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-danger/50 resize-none"
                                    placeholder="One per line..." value={formData.triggering_messages} onChange={(e) => setFormData({ ...formData, triggering_messages: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                                <Button type="submit" size="sm" disabled={submitting} className="bg-danger hover:bg-danger/90 text-white">
                                    {submitting ? "Reporting..." : "Report Crisis"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Active Alert Banner */}
            {activeCrises.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-danger/10 border border-danger/20 animate-pulse-soft">
                    <AlertTriangle size={16} className="text-danger shrink-0" />
                    <p className="text-sm font-medium text-danger">
                        {activeCrises.length} active crisis alert{activeCrises.length > 1 ? "s" : ""} requiring attention
                    </p>
                </div>
            )}

            {/* Crisis Cards */}
            {list.length === 0 ? (
                <Card className="bg-card border-border">
                    <EmptyState
                        icon={Shield}
                        title="All Clear"
                        description="No active crises detected across your creator portfolio. Keep monitoring."
                    />
                </Card>
            ) : (
                <div className="space-y-4 stagger-children">
                    {list.map((c: any) => {
                        const creatorName = creatorList.find((cr: any) => cr.id === c.creator_id)?.name || "Unknown";
                        return (
                            <Card key={c.id} className={`bg-card border-border ${severityClass[c.threat_level] || ""}`}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                {creatorName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{creatorName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className={`text-[10px] ${severityBadge[c.threat_level] || ""}`}>
                                                        {c.threat_level} threat
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[10px] ${c.status === "active" ? "bg-danger/10 text-danger border-danger/20" : "bg-success/10 text-success border-success/20"}`}>
                                                        {c.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Sentiment drop: <strong className="text-foreground">{((c.sentiment_drop || 0) * 100).toFixed(0)}%</strong></span>
                                            <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full bg-danger rounded-full" style={{ width: `${(c.sentiment_drop || 0) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5 flex-wrap mb-4">
                                        {(c.affected_platforms || []).map((p: string) => (
                                            <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                        ))}
                                    </div>

                                    {strategies[c.id] && strategies[c.id].length > 0 && (
                                        <div className="mb-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-accent-brand flex items-center gap-1.5 mb-3">
                                                <Brain size={12} /> AI Response Strategies
                                            </p>
                                            <div className="space-y-2">
                                                {strategies[c.id].map((s: any, i: number) => (
                                                    <div key={i} className="p-3 bg-card rounded-md border border-border/50">
                                                        <div className="flex justify-between mb-1.5">
                                                            <Badge variant="outline" className="text-[10px] text-accent-brand border-accent-brand/30">{s.type}</Badge>
                                                            <Badge variant="outline" className={`text-[10px] ${s.risk_level === "low" ? "text-success border-success/30" : s.risk_level === "high" ? "text-danger border-danger/30" : "text-warning border-warning/30"}`}>
                                                                {s.risk_level} risk
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">{s.message?.slice(0, 200)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => generateStrats(c.id)} disabled={strategizing === c.id}>
                                        <Zap size={12} className="text-accent-brand" />
                                        {strategizing === c.id ? "Generating..." : "Generate AI Strategies"}
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
