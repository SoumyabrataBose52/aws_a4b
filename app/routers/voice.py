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
    from app.config import get_settings
    settings = get_settings()

    if settings.FRONTEND_BUCKET_NAME:
        import boto3
        from botocore.exceptions import ClientError
        from fastapi.responses import RedirectResponse
        
        s3_client = boto3.client('s3', region_name=settings.AWS_REGION)
        s3_key = f"media/voice/{filename}"
        
        try:
            # Check if object exists first
            s3_client.head_object(Bucket=settings.FRONTEND_BUCKET_NAME, Key=s3_key)
            
            # Generate pre-signed URL valid for 1 hour
            url = s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': settings.FRONTEND_BUCKET_NAME,
                    'Key': s3_key,
                    'ResponseContentType': 'audio/mpeg'
                },
                ExpiresIn=3600
            )
            return RedirectResponse(url=url, status_code=307)
        except ClientError:
            # Fall back to checking local preview if not found in S3
            pass
            
    # Local fallback
    path = os.path.join("generated_audio", filename)
    if not os.path.exists(path):
        # Check previews subfolder
        path = os.path.join("generated_audio", "previews", filename)
    if not os.path.exists(path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/mpeg", filename=filename)
