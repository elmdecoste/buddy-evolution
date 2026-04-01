---
name: stats
description: Show buddy companion stats — level, XP, streak, personality stats, tier. Use when the user asks about their buddy's stats, level, progress, or XP.
---

# Buddy Stats

Read the buddy soul file at `~/.buddy-evolution/soul.json` and display the companion's stats.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. If the file doesn't exist, tell the user to start a new session so the plugin can initialize their buddy
3. Format the output as shown below

## Output format

Use this exact format (substitute real values):

```
{emoji} {name} — {rarity} {species} ({personality})
Level {level} {tier} {progress_bar} {currentXP} / {nextLevelXP} XP
Streak: {days} days {streak_multiplier}

DEBUGGING {bar}  {effective} (+{growth})
PATIENCE  {bar}  {effective} (+{growth})
CHAOS     {bar}  {effective} (+{growth})
WISDOM    {bar}  {effective} (+{growth})
SNARK     {bar}  {effective} (+{growth})

Sessions: {total} | Time: {hours}h | Files edited: {total}
```

## Formatting rules

- Progress bar: use █ for filled and ░ for empty, 20 chars wide
- Effective stat = base + growth (rounded), capped at 200
- Growth shown as integer in parentheses
- Streak multiplier: show `(🔥 {mult}x)` only if > 1.0
- Tier: capitalize first letter (Hatchling, Juvenile, Adult, Elder, Ascended)
- Rarity: capitalize first letter
- XP: format with commas (e.g., 45,200)
