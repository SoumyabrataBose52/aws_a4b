"""Voice router — text-to-speech with voice modulation for content creation."""
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from app.middleware.auth import verify_api_key
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/voice", tags=["Voice Studio"], dependencies=[Depends(verify_api_key)])


class VoiceGenerateRequest(BaseModel):
    text: str
    profile: str = "professional"  # professional, casual, energetic, calm, narrator, hindi
    speed: float = 1.0             # 0.5 to 2.0
    pitch_shift: int = 0           # -5 to +5 semitones


class VoicePreviewRequest(BaseModel):
    text: str
    profile: str = "professional"


@router.get("/profiles")
def list_profiles():
    """List available voice profiles."""
    from app.services.voice_service import get_voice_profiles
    return {"profiles": get_voice_profiles()}


@router.post("/generate")
async def generate_voiceover(req: VoiceGenerateRequest):
    """Generate a voiceover audio file from text with voice modulation."""
    from app.services.voice_service import generate_voiceover as gen
    result = await gen(
        text=req.text,
        profile=req.profile,
        speed=req.speed,
        pitch_shift=req.pitch_shift,
    )
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/preview")
async def preview_voice(req: VoicePreviewRequest):
    """Generate a short preview clip for the selected voice profile."""
    from app.services.voice_service import generate_preview
    result = await generate_preview(text=req.text, profile=req.profile)
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.get("/download/{filename}")
def download_audio(filename: str):
    """Download a generated audio file."""
    import os
    path = os.path.join("generated_audio", filename)
    if not os.path.exists(path):
        # Check previews subfolder
        path = os.path.join("generated_audio", "previews", filename)
    if not os.path.exists(path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/mpeg", filename=filename)
