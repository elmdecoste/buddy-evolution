---
name: journal
description: Show recent buddy journal entries — session history, XP gains, achievements earned. Use when the user asks about their session history, journal, or recent activity.
---

# Buddy Journal

Read and display recent journal entries.

## Instructions

1. Look for journal files in `~/.buddy-evolution/journal/`
2. Files are named `YYYY-MM.md` (one per month)
3. Read the most recent file
4. Display the last 10 entries (each entry starts with `## YYYY-MM-DD`)
5. If no journal files exist, tell the user that entries are created automatically at the end of each session

## Output

Show the raw markdown entries as-is — they are already well-formatted with project names, duration, tool counts, XP gains, and achievements.

If the user asks for a specific month, read that month's file (e.g., `2026-04.md`).
If the user asks for a summary, provide aggregate stats: total sessions, total XP, achievements earned, most-worked project.
