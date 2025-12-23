from services.llm_recommendation_service import get_llm_recommendation

def get_rule_based_recommendations(pcs, sedentary_seconds, profile):
    """
    Rule-based recommendations (fallback)
    """
    recs = []

    if sedentary_seconds > 1800:
        recs.append("Stand up and walk for 2 minutes")

    if pcs < 55:
        recs.append("Seated spinal stretch yoga")

    if profile.text_neck_count > 5:
        recs.append("Neck rotation and chin tuck exercise")

    if not recs:
        recs.append("Maintain your current posture")

    return recs


def get_recommendations(pcs, sedentary_seconds, profile):
    """
    Get recommendations: Try LLM first, fallback to rule-based
    """
    try:
        # Prepare summary for LLM
        summary = {
            'avg_pcs': round(pcs, 2),
            'sedentary_minutes': round(sedentary_seconds / 60, 1),
            'text_neck_count': profile.text_neck_count
        }
        
        # Try to get LLM recommendation
        llm_advice = get_llm_recommendation(summary)
        
        # Split LLM response into bullet points if possible
        if llm_advice:
            # Split by periods, newlines, or numbered points
            import re
            points = re.split(r'\.|\n|\d+\.', llm_advice)
            recs = [p.strip() for p in points if p.strip() and len(p.strip()) > 10]
            
            # If splitting failed, return as single recommendation
            if not recs:
                recs = [llm_advice]
            
            return recs
            
    except Exception as e:
        print(f"[LLM ERROR] Falling back to rule-based: {e}")
    
    # Fallback to rule-based recommendations
    return get_rule_based_recommendations(pcs, sedentary_seconds, profile)
