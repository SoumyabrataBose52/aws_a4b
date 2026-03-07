"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { creators } from "@/lib/api";
import { Users, Search, Plus, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddCreatorDialog } from "@/components/ui/add-creator-dialog";

export default function CreatorsPage() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");

    const refreshList = () => {
        setLoading(true);
        creators.list().then(setList).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshList();
    }, []);

    const filtered = list.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="animate-fade-in flex flex-col gap-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-up flex flex-col gap-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Creator Directory</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage profiles, platforms, and automation settings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
                        <Input
                            placeholder="Search creators..."
                            className="pl-8 h-9 w-full md:w-56 bg-secondary/50 border-border text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                        <TabsList className="h-9 bg-secondary/50">
                            <TabsTrigger value="grid" className="text-xs px-3">Grid</TabsTrigger>
                            <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <AddCreatorDialog onSuccess={refreshList} trigger={
                        <Button id="add-creator-btn" size="sm" className="bg-accent-brand hover:bg-accent-brand/90 text-white h-9 gap-1.5">
                            <Plus size={14} /> Add Creator
                        </Button>
                    } />
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <Card className="bg-card border-border">
                    <EmptyState
                        icon={Users}
                        title="No creators found"
                        description={search ? "No creators match your search. Try a different query." : "Add your first creator to initialize the workspace."}
                        actionLabel={search ? undefined : "Add Creator"}
                        onAction={search ? undefined : () => document.getElementById('add-creator-btn')?.click()}
                    />
                </Card>
            ) : view === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                    {filtered.map((c: any) => (
                        <Card key={c.id} className="card-glow bg-card border-border group">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <Link href={`/dashboard/creators/${c.id}`} className="flex items-center gap-3">
                                        {c.avatar_url ? (
                                            <img
                                                src={c.avatar_url}
                                                alt={c.name}
                                                className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-accent-brand/30 shadow-lg shadow-accent-brand/10"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg shadow-accent-brand/20">
                                                {c.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-sm group-hover:text-accent-brand transition-colors">{c.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {c.platforms?.length ? `${c.platforms.length} platform${c.platforms.length > 1 ? "s" : ""}` : "No platforms"}
                                            </p>
                                        </div>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal size={14} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-popover border-border">
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem className="text-danger">Deactivate</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex gap-1.5 flex-wrap mb-4">
                                    {(c.platforms || []).map((p: string) => (
                                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] ${c.status === "active" ? "bg-success/10 text-success border-success/20" : "text-muted-foreground"}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                                        {c.status}
                                    </Badge>
                                    <Link href={`/dashboard/creators/${c.id}`}>
                                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                                            Details →
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                /* List View */
                <Card className="bg-card border-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="text-xs">Creator</TableHead>
                                <TableHead className="text-xs">Platforms</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-xs text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((c: any) => (
                                <TableRow key={c.id} className="group border-border hover:bg-accent/30">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {c.avatar_url ? (
                                                <img
                                                    src={c.avatar_url}
                                                    alt={c.name}
                                                    className="w-8 h-8 rounded-full object-cover border border-accent-brand/30"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-brand to-accent-violet flex items-center justify-center text-xs font-bold text-white">
                                                    {c.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium text-sm">{c.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {(c.platforms || []).map((p: string) => (
                                                <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] ${c.status === "active" ? "bg-success/10 text-success border-success/20" : ""}`}>
                                            {c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/creators/${c.id}`}>
                                            <Button variant="ghost" size="sm" className="text-xs h-7">Manage</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
