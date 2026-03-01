"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { creators } from "@/lib/api";
import { UserPlus, Search, MoreHorizontal, Trash2, ExternalLink, Activity, Youtube, Mail, Edit3, Settings, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShimmerButton } from "@/components/ui/premium/shimmer-button";
import { GlassPanel } from "@/components/ui/premium/glass-panel";

export default function CreatorsPage() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", bio: "", platforms: "youtube", youtube_channel: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const loadCreators = async () => {
        try { setList(await creators.list()); } catch { }
        setLoading(false);
    };

    useEffect(() => { loadCreators(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const newCreator = await creators.create({
                name: formData.name,
                email: formData.email || undefined,
                bio: formData.bio || undefined,
                platforms: formData.platforms.split(",").map(p => p.trim()).filter(Boolean),
            });
            if (formData.youtube_channel) {
                try { await creators.onboard(newCreator.id, formData.youtube_channel); } catch { }
            }
            setFormData({ name: "", email: "", bio: "", platforms: "youtube", youtube_channel: "" });
            setIsDialogOpen(false);
            loadCreators();
        } catch (e: any) { setError(e.message); }
        setSubmitting(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from your roster? This action cannot be undone.`)) return;
        try { await creators.delete(id); loadCreators(); } catch { }
    };

    const filteredList = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-accent-brand animate-spin" />
                </div>
                <p className="text-text-secondary text-sm animate-pulse">Loading Roster...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 flex flex-col gap-6">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight">Creator Roster</h1>
                    <p className="text-text-secondary text-sm">Manage your talent portfolio, track onboarding, and monitor health.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer">
                            <ShimmerButton shimmerColor="#a29bfe" className="px-5 py-2">
                                <span className="flex items-center gap-2 whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                                    <UserPlus size={18} /> Add Talent
                                </span>
                            </ShimmerButton>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-white/10 bg-[#12121a]/95 backdrop-blur-3xl text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Onboard New Talent</DialogTitle>
                            <DialogDescription className="text-text-secondary">
                                Add a new creator to your command center portfolio.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            {error && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-center gap-2"><ShieldAlert size={16} />{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-sm font-medium text-text-secondary">Full Name</label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10 focus-visible:ring-accent-brand text-white" placeholder="John Doe" />
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-sm font-medium text-text-secondary">Contact Email</label>
                                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/10 focus-visible:ring-accent-brand text-white" placeholder="john@example.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Bio / Notes</label>
                                <Input value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="bg-white/5 border-white/10 focus-visible:ring-accent-brand text-white" placeholder="Tech reviewer, focused on AI..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary flex items-center gap-2"><Youtube size={16} className="text-[#ff0000]" /> YouTube Channel Logic</label>
                                <Input value={formData.youtube_channel} onChange={e => setFormData({ ...formData, youtube_channel: e.target.value })} className="bg-white/5 border-white/10 focus-visible:ring-accent-brand text-white" placeholder="@ChannelHandle or ID" />
                                <p className="text-[11px] text-text-secondary">Provide this to immediately begin background analytics scraping.</p>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={submitting} className="w-full bg-accent-brand hover:bg-[#5b4bcf] active:bg-[#4a3ca6] transition-colors text-white">
                                    {submitting ? "Initializing Tracking..." : "Confirm & Add to Roster"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <GlassPanel className="p-1">
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary size-4" />
                        <Input
                            placeholder="Search creators by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/[0.03] border-white/5 focus-visible:ring-white/10 text-sm h-9"
                        />
                    </div>
                </div>

                <div className="rounded-md border-0">
                    <Table>
                        <TableHeader className="bg-white/[0.01] hover:bg-white/[0.01]">
                            <TableRow className="border-white/5">
                                <TableHead className="w-[300px] text-text-secondary">Creator Info</TableHead>
                                <TableHead className="text-text-secondary">Platforms</TableHead>
                                <TableHead className="text-text-secondary">Status</TableHead>
                                <TableHead className="text-right text-text-secondary">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredList.length === 0 ? (
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableCell colSpan={4} className="h-32 text-center text-text-secondary">
                                        No creators found in roster.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredList.map((creator) => (
                                    <TableRow key={creator.id} className="border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => window.location.href = `/dashboard/creators/${creator.id}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-white/10">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}&backgroundColor=6c5ce7`} alt={creator.name} />
                                                    <AvatarFallback>{creator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-white group-hover:text-accent-brand transition-colors">{creator.name}</span>
                                                    {creator.email ? (
                                                        <span className="text-xs text-text-secondary flex items-center gap-1"><Mail size={10} />{creator.email}</span>
                                                    ) : (
                                                        <span className="text-xs text-text-secondary">No email linked</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {creator.platforms?.map((p: string) => (
                                                    <Badge key={p} variant="outline" className="bg-white/5 border-white/10 text-text-secondary text-[10px] uppercase font-bold tracking-wider">
                                                        {p}
                                                    </Badge>
                                                ))}
                                                {(!creator.platforms || creator.platforms.length === 0) && (
                                                    <span className="text-text-secondary text-xs italic">—</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {creator.status === "active" ? (
                                                <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                                                    <CheckCircle2 size={12} className="mr-1" /> Active
                                                </Badge>
                                            ) : creator.status === "onboarding" ? (
                                                <Badge variant="outline" className="text-warning border-warning/50">
                                                    <Activity size={12} className="mr-1 animate-pulse" /> Onboarding
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-white/10 text-white">
                                                    {creator.status}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-text-secondary hover:text-white">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-text-primary">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/creators/${creator.id}`; }} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                                                        <ExternalLink className="mr-2 h-4 w-4 text-accent-brand" /> View Analytics
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                                        <Edit3 className="mr-2 h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(creator.id, creator.name); }} className="cursor-pointer text-danger focus:bg-danger/10 focus:text-danger">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Creator
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </GlassPanel>
        </div>
    );
}
