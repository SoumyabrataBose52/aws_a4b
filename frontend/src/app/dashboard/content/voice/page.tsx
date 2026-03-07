'use client';
import { useState, useEffect } from 'react';
import { voice } from '@/lib/api';
import { Mic, Play, Pause, Download, Volume2, Gauge, ArrowUpDown, Sparkles } from 'lucide-react';

interface VoiceProfile {
    id: string;
    name: string;
    description: string;
    speed: number;
    pitch_shift: number;
    lang: string;
}

interface GenerationResult {
    file_path: string;
    file_name: string;
    profile: string;
    duration_seconds: number | null;
    config: { speed: number; pitch_shift: number; lang: string };
    text_length: number;
    word_count: number;
}

export default function VoiceStudioPage() {
    const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState('professional');
    const [text, setText] = useState('');
    const [speed, setSpeed] = useState(1.0);
    const [pitchShift, setPitchShift] = useState(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        voice.profiles().then((data: any) => {
            setProfiles(data.profiles || []);
        }).catch(() => { });
    }, []);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await voice.generate({ text, profile: selectedProfile, speed, pitch_shift: pitchShift });
            setResult(res);
            // Set up audio player
            const audioUrl = voice.downloadUrl(res.file_name);
            const newAudio = new Audio(audioUrl);
            setAudio(newAudio);
        } catch (e: any) {
            setError(e.message || 'Voice generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await voice.preview({ text, profile: selectedProfile });
            if (res.file_name) {
                const audioUrl = voice.downloadUrl(res.file_name);
                const previewAudio = new Audio(audioUrl);
                previewAudio.play();
            }
        } catch (e: any) {
            setError(e.message || 'Preview failed');
        } finally {
            setLoading(false);
        }
    };

    const togglePlay = () => {
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const currentProfile = profiles.find(p => p.id === selectedProfile);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mic className="w-8 h-8 text-purple-400" />
                    Voice Studio
                </h1>
                <p className="text-zinc-400 mt-1">Create voiceovers with AI-powered voice modulation for your content</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Text Input & Controls */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Script Input */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                        <label className="text-sm font-semibold text-zinc-300 mb-2 block">Your Script</label>
                        <textarea
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-500 min-h-[200px] resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="Enter your script text here... The voice engine will convert this text to speech with your selected voice profile and modulation settings."
                            value={text}
                            onChange={e => setText(e.target.value)}
                        />
                        <div className="flex justify-between items-center mt-3 text-xs text-zinc-500">
                            <span>{text.split(/\s+/).filter(Boolean).length} words · {text.length} characters</span>
                            <span>~{Math.ceil(text.split(/\s+/).filter(Boolean).length / 150)} min at normal speed</span>
                        </div>
                    </div>

                    {/* Modulation Controls */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            Voice Modulation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Speed */}
                            <div>
                                <label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                    <Gauge className="w-4 h-4" /> Speed: {speed.toFixed(2)}x
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.05"
                                    value={speed}
                                    onChange={e => setSpeed(parseFloat(e.target.value))}
                                    className="w-full accent-purple-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                    <span>Slow (0.5x)</span>
                                    <span>Normal</span>
                                    <span>Fast (2.0x)</span>
                                </div>
                            </div>
                            {/* Pitch */}
                            <div>
                                <label className="text-sm text-zinc-300 flex items-center gap-2 mb-2">
                                    <ArrowUpDown className="w-4 h-4" /> Pitch Shift: {pitchShift > 0 ? '+' : ''}{pitchShift} semitones
                                </label>
                                <input
                                    type="range"
                                    min="-5"
                                    max="5"
                                    step="1"
                                    value={pitchShift}
                                    onChange={e => setPitchShift(parseInt(e.target.value))}
                                    className="w-full accent-purple-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                    <span>Deep (-5)</span>
                                    <span>Normal</span>
                                    <span>High (+5)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handlePreview}
                            disabled={loading || !text.trim()}
                            className="px-6 py-3 rounded-xl border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 font-medium transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Volume2 className="w-4 h-4" /> Preview
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !text.trim()}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                            ) : (
                                <><Mic className="w-4 h-4" /> Generate Voiceover</>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-md p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                                ✅ Voiceover Generated
                            </h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={togglePlay}
                                    className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                </button>
                                <div>
                                    <p className="text-white font-medium">{result.file_name}</p>
                                    <p className="text-zinc-400 text-sm">
                                        {result.duration_seconds ? `${result.duration_seconds}s` : ''} · {result.word_count} words · {currentProfile?.name} voice
                                    </p>
                                </div>
                                <a
                                    href={voice.downloadUrl(result.file_name)}
                                    download
                                    className="ml-auto px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-2 transition"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </a>
                            </div>
                            <div className="text-xs text-zinc-500 grid grid-cols-3 gap-2 mt-2">
                                <span>Speed: {result.config.speed}x</span>
                                <span>Pitch: {result.config.pitch_shift > 0 ? '+' : ''}{result.config.pitch_shift}</span>
                                <span>Lang: {result.config.lang}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Voice Profiles */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-200">Voice Profiles</h3>
                    {profiles.map(profile => (
                        <button
                            key={profile.id}
                            onClick={() => {
                                setSelectedProfile(profile.id);
                                setSpeed(profile.speed);
                                setPitchShift(profile.pitch_shift);
                            }}
                            className={`w-full p-4 rounded-xl border text-left transition ${selectedProfile === profile.id
                                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="font-semibold text-white">{profile.name}</div>
                            <p className="text-xs text-zinc-400 mt-1">{profile.description}</p>
                            <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                                <span>Speed: {profile.speed}x</span>
                                <span>Pitch: {profile.pitch_shift > 0 ? '+' : ''}{profile.pitch_shift}</span>
                                <span>{profile.lang.toUpperCase()}</span>
                            </div>
                        </button>
                    ))}
                    {profiles.length === 0 && (
                        <div className="text-zinc-500 text-sm p-4 text-center">Loading profiles...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
