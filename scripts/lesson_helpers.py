"""Helpers for building Einstein Math lesson objects."""

def mc(qid, prompt, choices, answer, hint="", ok="", bad=""):
    item = {
        "id": qid, "type": "mc", "prompt": prompt, "choices": choices,
        "answer": answer,
    }
    if hint:
        item["hint"] = hint
    if ok:
        item["feedbackCorrect"] = ok
    if bad:
        item["feedbackWrong"] = bad
    return item

def fill(qid, prompt, answer, accept=None, hint="", ok="", bad=""):
    item = {
        "id": qid, "type": "fill", "prompt": prompt, "answer": answer,
        "accept": accept if isinstance(accept, list) else ([accept] if accept is not None else [answer]),
    }
    if hint:
        item["hint"] = hint
    if ok:
        item["feedbackCorrect"] = ok
    if bad:
        item["feedbackWrong"] = bad
    return item

def lesson(id, unitId, title, intro, panels, example, practice, check, prereqs=None, skills=None, duration=8):
    return {
        "id": id,
        "unitId": unitId,
        "title": title,
        "durationMin": duration,
        "prerequisites": prereqs or [],
        "skills": skills or [],
        "einsteinIntro": intro,
        "explain": {"panels": panels},
        "workedExample": example,
        "practice": practice,
        "quickCheck": check,
    }

def panels(*pairs):
    out = []
    for p in pairs:
        speech = p[0]
        visual = p[1] if len(p) > 1 else "generic"
        state = p[2] if len(p) > 2 else "explain"
        out.append({"speech": speech, "visual": visual, "state": state})
    return out

def example(title, speech, steps):
    return {"title": title, "speech": speech, "steps": steps}
