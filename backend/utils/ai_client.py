"""
AI Client Factory using OpenAI SDK for Gemini API (with Groq fallback).

Supports automatic provider fallback:
  1. Primary: Gemini API via OpenAI SDK (base_url: https://generativelanguage.googleapis.com/v1beta/openai/)
  2. Secondary Fallback: Groq API via OpenAI SDK (if Gemini hits 429 rate limit/quota or error)
"""
import os
import logging
import re
import json
from typing import Dict, Any, List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

DEFAULT_PLANNER_MODEL = "gemini-1.5-flash" if GEMINI_API_KEY else "llama-3.3-70b-versatile"
DEFAULT_EXPLAINER_MODEL = "gemini-1.5-flash" if GEMINI_API_KEY else "llama-3.1-8b-instant"

PLANNER_MODEL = os.getenv("PLANNER_MODEL", DEFAULT_PLANNER_MODEL)
EXPLAINER_MODEL = os.getenv("EXPLAINER_MODEL", DEFAULT_EXPLAINER_MODEL)


def is_ai_configured() -> bool:
    return bool(GEMINI_API_KEY or GROQ_API_KEY)


def call_chat_completion(
    system_prompt: str,
    user_prompt: str,
    default_model: str,
    temperature: float = 0.3,
    max_tokens: int = 800,
) -> Dict[str, Any]:
    """
    Executes chat completion with automatic provider fallback:
    Attempts Gemini API first. If quota 429 / error occurs, falls back to Groq API.
    Returns dict containing parsed JSON content and provider metadata.
    """
    providers_to_try = []

    if GEMINI_API_KEY:
        model_name = default_model if "gemini" in default_model else "gemini-1.5-flash"
        providers_to_try.append({
            "name": "gemini",
            "key": GEMINI_API_KEY,
            "base_url": GEMINI_BASE_URL,
            "model": model_name,
        })

    if GROQ_API_KEY:
        model_name = "llama-3.3-70b-versatile" if "planner" in default_model.lower() else "llama-3.1-8b-instant"
        providers_to_try.append({
            "name": "groq",
            "key": GROQ_API_KEY,
            "base_url": GROQ_BASE_URL,
            "model": model_name,
        })

    last_exception = None

    for prov in providers_to_try:
        try:
            logger.info("Attempting LLM call via %s (%s)...", prov["name"], prov["model"])
            client = OpenAI(api_key=prov["key"], base_url=prov["base_url"])
            response = client.chat.completions.create(
                model=prov["model"],
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            raw_text = response.choices[0].message.content or ""
            cleaned_text = re.sub(r"```(?:json)?", "", raw_text).strip().rstrip("`").strip()
            parsed_json = json.loads(cleaned_text)

            return {
                "success": True,
                "data": parsed_json,
                "powered_by": f"{prov['name']}/{prov['model']}",
            }
        except Exception as exc:
            logger.warning("LLM call failed for provider %s (%s): %s", prov["name"], prov["model"], exc)
            last_exception = exc

    raise RuntimeError(f"All LLM providers failed. Last error: {last_exception}")
