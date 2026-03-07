'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';
import { creators } from '@/lib/api';

interface AddCreatorDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function AddCreatorDialog({ onSuccess, trigger }: AddCreatorDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        youtube_channel_id: '',
        bio: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await creators.create({
                name: formData.name,
                email: formData.email || undefined,
                youtube_channel_id: formData.youtube_channel_id || undefined,
                bio: formData.bio || undefined,
                platforms: formData.youtube_channel_id ? ['youtube'] : []
            });
            setOpen(false);
            setFormData({ name: '', email: '', youtube_channel_id: '', bio: '' });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create creator');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="bg-accent-brand hover:bg-accent-brand/90 text-white h-9 gap-1.5">
                        <Plus size={14} /> Add Creator
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Add New Creator</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Creator Name *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. MKBHD"
                            className="bg-secondary/50 border-border"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Email (optional)</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contact@creator.com"
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">YouTube Channel ID or @handle (optional)</label>
                        <Input
                            value={formData.youtube_channel_id}
                            onChange={(e) => setFormData({ ...formData, youtube_channel_id: e.target.value })}
                            placeholder="e.g. UCX6OQ3DkcsbYNE6H8uQQuVA or @mkbhd"
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Short Bio (optional)</label>
                        <Input
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tech reviewer based in NJ"
                            className="bg-secondary/50 border-border"
                        />
                    </div>

                    {error && <p className="text-xs text-danger">{error}</p>}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-accent-brand hover:bg-accent-brand/90 text-white">
                            {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                            {loading ? "Adding..." : "Add Creator"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
