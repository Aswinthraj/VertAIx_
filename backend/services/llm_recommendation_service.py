import os
import requests
import random

API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Primary and fallback Groq models
CANDIDATE_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "allam-2-7b"
]

VARIED_FOCUS_AREAS = [
    "shoulder and upper-back relaxation",
    "cervical spine and chin-tuck alignment",
    "lumbar support and seated pelvis position",
    "seated breathing and chest opening stretch",
    "eye-level monitor ergonomic adjustment and wrist placement"
]

def get_llm_recommendation(summary):
    groq_api_key = os.getenv("GROQ_API_KEY")

    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY not configured in .env file")

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }

    focus = random.choice(VARIED_FOCUS_AREAS)
    avg_pcs = summary.get('avg_pcs', 0)
    sedentary_minutes = summary.get('sedentary_minutes', 0)
    text_neck_count = summary.get('text_neck_count', 0)

    prompt = (
        f"Telemetry Context: Mean Posture Confidence Score: {avg_pcs}/100, "
        f"Continuous Sitting Duration: {sedentary_minutes} mins, "
        f"Forward-Head / Text-Neck Instances: {text_neck_count}. "
        f"Provide 2-3 concise, fresh sentences of actionable ergonomic advice with a focus on {focus}. "
        "Be encouraging, specific, and direct."
    )

    payload = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are the VertAIx Ergonomic Posture AI. You provide concise, practical, "
                    "non-repetitive ergonomic adjustments based on live computer-vision posture telemetry. "
                    "Never use generic filler greetings. Keep the response to 2-3 direct sentences."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }

    last_error = None
    for model_name in CANDIDATE_MODELS:
        payload["model"] = model_name
        try:
            r = requests.post(API_URL, json=payload, headers=headers, timeout=12)
            if r.status_code == 200:
                content = r.json()["choices"][0]["message"]["content"].strip()
                if content:
                    return content
            else:
                last_error = f"Status {r.status_code}: {r.text}"
        except Exception as e:
            last_error = str(e)
            continue

    if last_error:
        print(f"[LLM API ERROR] All models failed. Last error: {last_error}")
        raise RuntimeError(f"Groq models failed: {last_error}")

    raise RuntimeError("No response received from Groq API")
