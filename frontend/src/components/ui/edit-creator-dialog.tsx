'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { creators } from '@/lib/api';

interface EditCreatorDialogProps {
    creator: any;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function EditCreatorDialog({ creator, onSuccess, trigger }: EditCreatorDialogProps) {
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: creator.name || '',
        email: creator.email || '',
        youtube_channel_id: creator.youtube_channel_id || '',
        bio: creator.bio || ''
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
            await creators.update(creator.id, {
                name: formData.name,
                email: formData.email || null,
                youtube_channel_id: formData.youtube_channel_id || null,
                bio: formData.bio || null,
            });
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update creator');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Edit Creator</DialogTitle>
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
                        <label className="text-xs font-medium text-muted-foreground">YouTube Channel ID (optional)</label>
                        <Input
                            value={formData.youtube_channel_id}
                            onChange={(e) => setFormData({ ...formData, youtube_channel_id: e.target.value })}
                            placeholder="e.g. UCX6OQ3DkcsbYNE6H8uQQuVA"
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
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
