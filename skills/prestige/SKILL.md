---
name: prestige
description: Prestige your buddy companion — reset to level 1 with a new track terrain. Use when the user wants to prestige, reset their level, or asks about prestige.
---

# Buddy Prestige

Prestige resets your buddy to level 1 but permanently upgrades your track terrain. Stats, achievements, and streak are preserved.

## How to execute

1. Read `~/.buddy-evolution/soul.json`
2. Check if the buddy is eligible:
   - `progression.level` must be 20
   - `progression.prestige` (or 0 if missing) must be less than 9
3. If not eligible, tell the user what they need (level 20 to prestige, or they're at max prestige)
4. If eligible, show them what they'll get and confirm:

```
Ready to prestige!

Current: Prestige {current} — {current terrain name}
Next:    Prestige {next} — {next terrain name}

This will:
  - Reset your level to 1
  - Reset your XP to 0
  - Keep all stats, achievements, and streak
  - Change your track terrain permanently

Proceed?
```

5. On confirmation, update soul.json:
   - Increment `progression.prestige` (default 0 → 1)
   - Set `progression.level` to 1
   - Set `progression.totalXP` to 0
   - Set `progression.tier` to "hatchling"
   - Append current ISO timestamp to `progression.prestigedAt` array (create if missing)
   - Save the file

6. Announce:
```
✧ Prestige {level}! Your track now shimmers with {terrain name}.
  The journey begins again...
```

## Terrain progression

| Prestige | Terrain | Visual |
|----------|---------|--------|
| 0 | Dirt Path | · |
| 1 | Stone Road | ░ |
| 2 | Mystic Trail | ▒ |
| 3 | Cloud Walk | ~ |
| 4 | Starlit Path | ✦ |
| 5 | Crystal Road | ◆ |
| 6 | Bloom Trail | ❋ |
| 7 | Lightning Lane | ⚡ |
| 8 | Ruby Path | ♦ |
| 9 | Eternal Road | ∞ |
