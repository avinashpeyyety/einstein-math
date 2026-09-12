#!/usr/bin/env python3
"""Expand Einstein Math curriculum ~2× and bump meta to 2.2.0."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import lessons_56
import lessons_78
import lessons_910

CURRICULUM = ROOT / "data" / "curriculum.json"


def add_lessons(track, lessons_list, new_units=None):
    if new_units:
        existing = {u["id"] for u in track["units"]}
        for u in new_units:
            if u["id"] not in existing:
                track["units"].append(u)
                existing.add(u["id"])
    for L in lessons_list:
        lid = L["id"]
        if lid in track["lessons"]:
            raise SystemExit(f"Duplicate lesson id {lid}")
        # Ensure old IDs never touched — only add
        track["lessons"][lid] = L
        unit = next((u for u in track["units"] if u["id"] == L["unitId"]), None)
        if not unit:
            raise SystemExit(f"Missing unit {L['unitId']} for {lid}")
        if lid not in unit["lessons"]:
            unit["lessons"].append(lid)


def main():
    data = json.loads(CURRICULUM.read_text())
    old_ids = {tid: set(t["lessons"].keys()) for tid, t in data["tracks"].items()}

    specs = [
        ("ages-5-6", lessons_56),
        ("ages-7-8", lessons_78),
        ("ages-9-10", lessons_910),
    ]
    for tid, mod in specs:
        track = data["tracks"][tid]
        add_lessons(track, mod.build(), getattr(mod, "NEW_UNITS", None))
        track["diagnostic"]["questions"] = mod.DIAG
        track["blurb"] = mod.BLURB

    data["meta"]["version"] = "2.2.0"
    data["meta"]["subtitle"] = "Cosmic Adventures in Numbers — ~30 Lessons/Track + Parent Summary!"

    # Validate
    for tid, t in data["tracks"].items():
        n = len(t["lessons"])
        wired = sum(len(u["lessons"]) for u in t["units"])
        assert n == wired, (tid, n, wired)
        assert n >= 28, (tid, n)
        assert old_ids[tid].issubset(set(t["lessons"].keys())), tid
        assert len(t["diagnostic"]["questions"]) == 10, tid
        for lid, L in t["lessons"].items():
            assert L.get("einsteinIntro"), lid
            assert L.get("explain", {}).get("panels"), lid
            assert L.get("workedExample"), lid
            assert L["unitId"], lid
            if lid not in old_ids[tid]:
                assert len(L.get("practice", [])) >= 3, lid
                assert len(L.get("quickCheck", [])) >= 2, lid

    CURRICULUM.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    for tid, t in data["tracks"].items():
        print(f"{tid}: {len(t['lessons'])} lessons, {len(t['units'])} units")
        print("  units:", [(u["id"], len(u["lessons"])) for u in t["units"]])
    print("version", data["meta"]["version"], "bytes", CURRICULUM.stat().st_size)


if __name__ == "__main__":
    main()
