import os
import requests

API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"  # Fast, reliable model for real-time responses
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_llm_recommendation(summary):
    # Check if API key exists
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY not configured in .env file")
    
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a posture and wellness coach. Give short, safe, non-medical advice."
            },
            {
                "role": "user",
                "content": (
                    f"Average PCS: {summary['avg_pcs']}\n"
                    f"Sitting time: {summary['sedentary_minutes']} minutes\n"
                    f"Text neck count: {summary['text_neck_count']}\n\n"
                    "Give 2–3 sentences of posture/yoga advice."
                )
            }
        ],
        "temperature": 0.4,
        "max_tokens": 120
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        r = requests.post(API_URL, json=payload, headers=headers, timeout=20)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except requests.exceptions.HTTPError as e:
        # Print detailed error for debugging
        error_detail = ""
        try:
            error_detail = r.json()
        except:
            error_detail = r.text
        print(f"[LLM API ERROR] Status: {r.status_code}, Detail: {error_detail}")
        raise
