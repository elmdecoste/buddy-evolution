---
name: stats
description: Show buddy companion stats — level, XP, streak, personality stats, tier, top files, top projects. Use when the user asks about their buddy's stats, level, progress, or XP.
---

# Buddy Stats

Read the buddy soul file at `~/.buddy-evolution/soul.json` and display the companion's stats.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. If the file doesn't exist, tell the user to start a new session so the plugin can initialize their buddy
3. Format the output as shown below

## Output format

```
{emoji} {name} — {rarity} {species} ({personality})
Level {level} {tier} {progress_bar} {currentXP} / {nextLevelXP} XP
Streak: {days} days {streak_multiplier} | Sessions: {total}

DEBUGGING {bar}  {effective} (+{growth})
PATIENCE  {bar}  {effective} (+{growth})
CHAOS     {bar}  {effective} (+{growth})
WISDOM    {bar}  {effective} (+{growth})
SNARK     {bar}  {effective} (+{growth})

Top files:
  {filepath} ·· {touches} touches ({familiarity_level})
  ...

Top projects:
  {project_name} — {sessions} sessions | {xpEarned} XP
  ...
```

## Formatting rules

- Progress bars: use █ for filled and ░ for empty, 20 chars wide for stats, 15 for level
- Effective stat = base + growth (rounded), capped at 200
- Growth shown as integer in parentheses
- Streak multiplier: show `(🔥 {mult}x)` only if > 1.0
- Tier: capitalize first letter
- XP: format with commas
- Top files: show up to 5 files sorted by touches descending, across all projects. Familiarity levels: <10 touches = New, 10-49 = Familiar, 50+ = Expert. If `last` date is 30+ days ago and touches >= 10, show as Nostalgic.
- Top projects: show up to 3 projects sorted by xpEarned descending. Use `path.basename()` for display name.
- If no familiarity data, skip those sections
