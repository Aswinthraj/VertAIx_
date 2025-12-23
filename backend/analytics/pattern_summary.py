def build_sitting_summary(pcs, sedentary_time, profile):
    return {
        "avg_pcs": round(pcs, 1),
        "sedentary_minutes": sedentary_time // 60,
        "text_neck_count": profile.text_neck_count,
    }
