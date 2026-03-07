'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { instagram } from '@/lib/api';
import { Instagram, Users, Image as ImageIcon, BarChart, Loader2, LogIn, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';

function InstagramDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    const [profile, setProfile] = useState<any>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [insights, setInsights] = useState<any>(null);

    const urlToken = searchParams.get('token');
    const urlError = searchParams.get('error');

    // Load token from URL
    useEffect(() => {
        if (urlToken) {
            setToken(urlToken);
            // Clean up URL without refreshing
            window.history.replaceState(null, '', '/dashboard/analytics/instagram');
        }
    }, [urlToken]);

    // Fetch accounts when token is available
    useEffect(() => {
        if (!token) return;
        const fetchAccounts = async () => {
            setLoading(true);
            try {
                const res = await instagram.accounts(token);
                setAccounts(res.accounts || []);
                if (res.accounts && res.accounts.length > 0) {
                    handleSelectAccount(res.accounts[0].id);
                }
            } catch (err: any) {
                console.error("Failed to fetch accounts", err);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, [token]);

    const handleConnect = async () => {
        try {
            setLoading(true);
            const res = await instagram.getAuthUrl();
            if (res.auth_url) {
                window.location.href = res.auth_url;
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const handleSelectAccount = async (id: string) => {
        if (!token) return;
        setSelectedAccount(id);
        setLoading(true);
        setProfile(null);
        setMedia([]);
        setInsights(null);

        try {
            const [_profile, _media, _insights] = await Promise.all([
                instagram.profile(id, token).catch(() => null),
                instagram.media(id, token, 12).catch(() => ({ media: [] })),
                instagram.insights(id, token, 7).catch(() => null)
            ]);
            setProfile(_profile);
            setMedia(_media?.media || []);
            setInsights(_insights?.metrics || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <Instagram className="w-10 h-10 text-white" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Connect Instagram</h2>
                    <p className="text-zinc-400 max-w-md mx-auto">
                        Link your Instagram Professional account to view real-time insights, media performance, and audience analytics.
                    </p>
                </div>
                {urlError && <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">{urlError}</div>}
                <Button onClick={handleConnect} disabled={loading} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white h-11 px-8 rounded-full shadow-md transition-all hover:shadow-lg hover:shadow-pink-500/25">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                    {loading ? "Connecting..." : "Authenticate with Facebook"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Header & Account Selection */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                            <Instagram className="w-5 h-5 text-white" />
                        </div>
                        Instagram Overview
                    </h1>
                </div>
                {accounts.length > 1 && (
                    <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
                        {accounts.map(acc => (
                            <button
                                key={acc.id}
                                onClick={() => handleSelectAccount(acc.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAccount === acc.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {acc.name || acc.username}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && !profile ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : profile && (
                <>
                    {/* Profile Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-card border-border flex items-center p-6 gap-4 col-span-1 md:col-span-4 lg:col-span-1">
                            <img src={profile.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full border-2 border-purple-500 object-cover" />
                            <div>
                                <h2 className="font-bold text-lg">{profile.name}</h2>
                                <p className="text-sm text-zinc-400">@{profile.username}</p>
                                {profile.biography && <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{profile.biography}</p>}
                            </div>
                        </Card>

                        <Card className="bg-card border-border p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <Users size={16} /> <span className="text-sm font-medium">Followers</span>
                            </div>
                            <p className="text-3xl font-bold">{(profile.followers_count || 0).toLocaleString()}</p>
                        </Card>

                        <Card className="bg-card border-border p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <ImageIcon size={16} /> <span className="text-sm font-medium">Media Count</span>
                            </div>
                            <p className="text-3xl font-bold">{(profile.media_count || 0).toLocaleString()}</p>
                        </Card>

                        <Card className="bg-card border-border p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <BarChart size={16} /> <span className="text-sm font-medium">Profile Reach</span>
                            </div>
                            <p className="text-3xl font-bold">
                                {(insights?.reach || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-zinc-500 flex justify-between mt-1"><span>Last 7 Days</span></p>
                        </Card>
                    </div>

                    {/* Media Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-purple-400" /> Recent Posts
                            </h2>
                        </div>

                        <ResponsiveGrid autoFill minItemWidth={250} gap={16}>
                            {media.map((item) => (
                                <a
                                    href={item.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={item.id}
                                    className="block group"
                                >
                                    <Card className="bg-card border-border overflow-hidden h-full hover:border-purple-500/50 transition-colors">
                                        <div className="relative aspect-square bg-zinc-900 border-b border-white/5">
                                            <img
                                                src={item.thumbnail_url || item.media_url}
                                                alt="Instagram Media"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-medium text-white uppercase tracking-wider">
                                                {item.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : item.media_type}
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ExternalLink className="w-8 h-8 text-white drop-shadow-md" />
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed pb-2 border-b border-white/5">
                                                {item.caption || "No caption"}
                                            </p>
                                            <div className="flex justify-between items-center mt-3 text-xs text-zinc-500">
                                                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                                <div className="flex gap-3">
                                                    <span className="flex items-center gap-1.5"><HeartIcon /> {item.like_count || 0}</span>
                                                    <span className="flex items-center gap-1.5"><MessageIcon /> {item.comments_count || 0}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            ))}
                        </ResponsiveGrid>
                        {media.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 border border-white/5 rounded-2xl bg-white/5">
                                No recent media found for this account.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Sub-components for icons
const HeartIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const MessageIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);

export default function InstagramPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto h-full">
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
                <InstagramDashboard />
            </Suspense>
        </div>
    );
}
