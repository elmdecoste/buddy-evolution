---
name: help
description: Explain the buddy-evolution plugin — what it does, available commands, how achievements work, where data is stored. Use when the user asks about buddy-evolution, how it works, or needs help with the plugin.
---

# Buddy Evolution — Help

## What is this?

buddy-evolution is a Claude Code plugin that turns your coding sessions into a progression system. Every session earns XP, grows your stats, and can unlock achievements. Your companion buddy tracks everything across all your projects.

## Commands

| Command | What it does |
|---|---|
| `/buddy-evolution:stats` | Show level, XP, stats, streak |
| `/buddy-evolution:achievements` | Show earned, in-progress, locked achievements |
| `/buddy-evolution:journal` | Show recent session history |
| `/buddy-evolution:help` | This help page |

## How it works

1. **Session Start**: Your buddy greets you with current stats and streak
2. **During Session**: You code normally — the plugin doesn't interfere
3. **Session End**: The plugin reads your session transcript and extracts metrics:
   - Tool calls (total, by type)
   - File edits (Write/Edit operations)
   - Test runs (detected from Bash commands)
   - Session duration
4. **Progression**: Metrics are converted to XP, stats grow, achievements are checked
5. **Journal**: A session summary is appended to your monthly journal

## Progression

- **XP Sources**: Tool calls (50 XP), file edits (100 XP), test runs (200 XP), duration bonus, session completion (500 XP flat)
- **Streak**: Consecutive days multiply XP (1.0x → 2.0x over 11 days)
- **Levels**: 1-20, with evolution tiers at levels 5, 10, 15, 20
- **Stats**: DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK — grow from your activity patterns with diminishing returns

## Achievements

34 achievements across 6 categories (Coding, Testing, Debugging, Consistency, Exploration, Meta). Includes 2 hidden achievements for discovery. Use `/buddy-evolution:achievements` to see them all.

## Data Location

All data is stored locally at `~/.buddy-evolution/`:
- `soul.json` — Your companion's state (identity, stats, achievements, progression)
- `journal/` — Monthly session logs (YYYY-MM.md files)

No data is sent anywhere. Everything stays on your machine.

## Your Buddy

Your buddy species and personality are deterministically generated from your machine identity (hostname + username). Same machine = same buddy. The species, name, base stats, and personality are set at creation and don't change — but your stats grow and achievements accumulate over time.
