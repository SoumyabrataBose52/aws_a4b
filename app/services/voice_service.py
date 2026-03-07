"""
Voice Modulation Service — Text-to-speech with voice modulation for content creation.

Provides multiple voice profiles with adjustable parameters:
- Pitch, speed, emphasis
- Professional, casual, energetic, calm presets
- Script-to-voiceover pipeline with section-based modulation

Uses gTTS for speech synthesis with post-processing via pydub for modulation.
"""

import logging
import os
import uuid
import io
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

# Voice profiles with default settings
VOICE_PROFILES = {
    "professional": {
        "name": "Professional",
        "description": "Clear, authoritative tone for business content",
        "speed": 1.0,
        "pitch_shift": 0,
        "lang": "en",
        "tld": "co.uk",  # British English accent
    },
    "casual": {
        "name": "Casual",
        "description": "Friendly, conversational tone for vlogs and social media",
        "speed": 1.05,
        "pitch_shift": 1,
        "lang": "en",
        "tld": "com",  # US English accent
    },
    "energetic": {
        "name": "Energetic",
        "description": "Upbeat, excited tone for promotional content",
        "speed": 1.15,
        "pitch_shift": 2,
        "lang": "en",
        "tld": "com",
    },
    "calm": {
        "name": "Calm",
        "description": "Soothing, relaxed tone for educational or meditation content",
        "speed": 0.9,
        "pitch_shift": -1,
        "lang": "en",
        "tld": "co.uk",
    },
    "narrator": {
        "name": "Narrator",
        "description": "Deep, storytelling tone for documentaries and explainers",
        "speed": 0.95,
        "pitch_shift": -2,
        "lang": "en",
        "tld": "co.uk",
    },
    "hindi": {
        "name": "Hindi",
        "description": "Hindi language voiceover for Indian content",
        "speed": 1.0,
        "pitch_shift": 0,
        "lang": "hi",
        "tld": "co.in",
    },
}


@dataclass
class VoiceConfig:
    profile: str = "professional"
    speed: float = 1.0           # 0.5 to 2.0
    pitch_shift: int = 0         # -5 to +5 semitones
    volume_boost: float = 0.0    # dB boost
    lang: str = "en"
    tld: str = "com"


def get_voice_profiles() -> list[dict]:
    """Return list of available voice profiles."""
    return [
        {"id": pid, **profile}
        for pid, profile in VOICE_PROFILES.items()
    ]


def _apply_profile(config: VoiceConfig, profile_id: str) -> VoiceConfig:
    """Apply a voice profile's defaults to the config."""
    profile = VOICE_PROFILES.get(profile_id)
    if profile:
        config.lang = profile.get("lang", config.lang)
        config.tld = profile.get("tld", config.tld)
        if config.speed == 1.0:
            config.speed = profile.get("speed", 1.0)
        if config.pitch_shift == 0:
            config.pitch_shift = profile.get("pitch_shift", 0)
    return config


async def generate_voiceover(
    text: str,
    profile: str = "professional",
    speed: float = 1.0,
    pitch_shift: int = 0,
    output_dir: str = "generated_audio",
) -> dict:
    """
    Generate a voiceover audio file from text with modulation.

    Args:
        text: The script text to convert to speech
        profile: Voice profile ID
        speed: Playback speed (0.5 to 2.0)
        pitch_shift: Pitch shift in semitones (-5 to +5)
        output_dir: Directory to save the audio file

    Returns:
        Dict with file path, duration, and metadata
    """
    config = VoiceConfig(profile=profile, speed=speed, pitch_shift=pitch_shift)
    config = _apply_profile(config, profile)

    # Clamp values
    config.speed = max(0.5, min(2.0, config.speed))
    config.pitch_shift = max(-5, min(5, config.pitch_shift))

    os.makedirs(output_dir, exist_ok=True)
    file_id = str(uuid.uuid4())[:8]
    base_path = os.path.join(output_dir, f"voiceover_{file_id}")

    try:
        # Step 1: Generate raw TTS audio
        from gtts import gTTS

        tts = gTTS(text=text, lang=config.lang, tld=config.tld, slow=(config.speed < 0.85))
        raw_path = f"{base_path}_raw.mp3"
        tts.save(raw_path)

        # Step 2: Apply modulation (speed, pitch) using pydub
        try:
            from pydub import AudioSegment

            audio = AudioSegment.from_mp3(raw_path)

            # Speed adjustment (without changing pitch first)
            if abs(config.speed - 1.0) > 0.05:
                # Change playback speed by altering frame rate
                new_frame_rate = int(audio.frame_rate * config.speed)
                audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
                audio = audio.set_frame_rate(44100)  # Normalize back

            # Pitch shift (approximate via frame rate)
            if config.pitch_shift != 0:
                semitone_ratio = 2 ** (config.pitch_shift / 12.0)
                new_frame_rate = int(audio.frame_rate * semitone_ratio)
                audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
                audio = audio.set_frame_rate(44100)

            # Export final
            final_path = f"{base_path}.mp3"
            audio.export(final_path, format="mp3")
            duration_ms = len(audio)

            # Clean up raw file
            os.remove(raw_path)

        except ImportError:
            logger.warning("pydub not installed — skipping modulation, using raw TTS output")
            final_path = raw_path
            duration_ms = 0

        return {
            "file_path": final_path,
            "file_name": os.path.basename(final_path),
            "profile": profile,
            "duration_seconds": round(duration_ms / 1000, 1) if duration_ms else None,
            "config": {
                "speed": config.speed,
                "pitch_shift": config.pitch_shift,
                "lang": config.lang,
            },
            "text_length": len(text),
            "word_count": len(text.split()),
        }

    except Exception as e:
        logger.error(f"Voice generation failed: {e}")
        return {"error": str(e)}


async def generate_preview(text: str, profile: str = "professional") -> dict:
    """Generate a short preview clip (first 100 chars)."""
    preview_text = text[:100] + ("..." if len(text) > 100 else "")
    return await generate_voiceover(preview_text, profile=profile, output_dir="generated_audio/previews")
