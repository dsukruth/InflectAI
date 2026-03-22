from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

_KEY = lambda: os.getenv("ELEVENLABS_API_KEY")
_VOICE_ID = lambda: os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


class TtsRequest(BaseModel):
    text: str


@router.post("/synthesize")
async def synthesize(req: TtsRequest):
    key = _KEY()
    voice_id = _VOICE_ID()
    if not key or not req.text.strip():
        return Response(status_code=503, content=b"")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": req.text[:2500],
        "model_id": "eleven_multilingual_v2",
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                url,
                headers={
                    "xi-api-key": key,
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if r.status_code != 200:
                return Response(
                    status_code=r.status_code,
                    content=r.content,
                    media_type="text/plain",
                )
            return StreamingResponse(
                iter([r.content]),
                media_type="audio/mpeg",
            )
    except Exception as e:
        return Response(status_code=500, content=str(e).encode(), media_type="text/plain")


@router.get("/voices")
async def list_voices():
    key = _KEY()
    if not key:
        return Response(status_code=503, content=b"ELEVENLABS_API_KEY not set")
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": key},
        )
        return r.json()
