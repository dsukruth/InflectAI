from __future__ import annotations

import os
import tempfile

import httpx
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from groq import Groq

from app.agents.voice_agent import VoiceAgent

router = APIRouter()

_ELEVENLABS_KEY = lambda: os.getenv("ELEVENLABS_API_KEY")
_VOICE_ID = lambda: os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


async def _transcribe_elevenlabs(path: str, filename: str) -> tuple[str, float] | None:
    key = _ELEVENLABS_KEY()
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            with open(path, "rb") as f:
                files = {"file": (filename or "audio.webm", f, "audio/webm")}
                data = {"model_id": "scribe_v2"}
                r = await client.post(
                    "https://api.elevenlabs.io/v1/speech-to-text",
                    headers={"xi-api-key": key},
                    files=files,
                    data=data,
                )
        if r.status_code != 200:
            return None
        payload = r.json()
        text = payload.get("text") or ""
        if not text:
            return None
        conf = float(payload.get("language_probability", 0.92) or 0.92)
        return (text.strip(), conf)
    except Exception:
        return None


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    suffix = os.path.splitext(audio.filename or "")[1] or ".webm"
    tmp_path: str | None = None
    try:
        content = await audio.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        assert tmp_path is not None
        el = await _transcribe_elevenlabs(tmp_path, audio.filename or "recording.webm")
        if el:
            return {"transcript": el[0], "confidence": el[1]}

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return {"transcript": "", "confidence": 0.0, "error": "No STT provider"}

        client = Groq(api_key=api_key)
        with open(tmp_path, "rb") as f:
            data = f.read()

        transcription = client.audio.transcriptions.create(
            file=(audio.filename or "audio.webm", data),
            model="whisper-large-v3",
            language="en",
        )
        return {"transcript": transcription.text, "confidence": 0.95}
    except Exception as e:
        return {"transcript": "", "confidence": 0.0, "error": str(e)}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


@router.post("/voice-query")
async def voice_query(audio: UploadFile = File(...)):
    """Full pipeline: audio → STT → VoiceAgent → TTS → MP3 stream.

    Response headers:
      X-Transcript      — what the user said
      X-Agent-Response  — the agent's text reply
    """
    key = _ELEVENLABS_KEY()
    voice_id = _VOICE_ID()

    if not key:
        return {"error": "ELEVENLABS_API_KEY not set"}

    # Step 1: STT
    audio_bytes = await audio.read()
    async with httpx.AsyncClient(timeout=30.0) as client:
        stt_resp = await client.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": key},
            files={"file": (audio.filename, audio_bytes, audio.content_type)},
            data={"model_id": "scribe_v1"},
        )

    if stt_resp.status_code != 200:
        return {"error": "STT failed", "detail": stt_resp.text}

    transcript = stt_resp.json().get("text", "")

    # Step 2: Agent
    agent_result = await VoiceAgent().run({"transcript": transcript})
    agent_text = agent_result["response"]

    # Step 3: TTS
    async with httpx.AsyncClient(timeout=30.0) as client:
        tts_resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
            headers={"xi-api-key": key, "Content-Type": "application/json"},
            json={
                "text": agent_text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True,
                },
            },
        )

    if tts_resp.status_code != 200:
        return {"error": "TTS failed", "detail": tts_resp.text}

    return StreamingResponse(
        iter([tts_resp.content]),
        media_type="audio/mpeg",
        headers={
            "X-Transcript": transcript,
            "X-Agent-Response": agent_text,
            "Content-Disposition": "attachment; filename=reply.mp3",
        },
    )
