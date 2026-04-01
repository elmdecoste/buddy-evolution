---
name: export
description: Generate a shareable stats card for your buddy companion. Use when the user wants to export, share, or show off their buddy stats, or wants a summary card.
---

# Export Buddy Card

Generate a shareable stats card.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. Calculate effective stats (base + growth, rounded)
3. Find the peak stat (highest effective)
4. Format as the card below
5. Output the card — the user can copy-paste it

## Card format

```
┌────────────────────────────────────┐
│ {emoji} {name} — {Rarity} {Species}      │
│ {personality} | {evolutionPath or "Hatchling"}        │
│                                    │
│ Level {level} {Tier}               │
│ {progress_bar} {currentXP} / {nextXP} XP │
│                                    │
│ {earned}/{total} achievements      │
│ {sessions} sessions | {streak} day streak │
│ Peak: {STAT_NAME} {effective_value}       │
│ Hatched: {hatchedAt date}          │
└────────────────────────────────────┘
```

## Rules

- Use box-drawing characters (┌ ─ ┐ │ └ ┘)
- Align contents within the box
- Progress bar: 20 chars wide with █ and ░
- Rarity/Tier/Species: capitalize first letter
- XP: format with commas
- achievements total = 32 (non-hidden)
- evolutionPath: join with " → " if multiple entries, or "Hatchling" if empty
- If the user asks for markdown format instead of box, output as a clean markdown block without the box
- Hatched date: format as YYYY-MM-DD
