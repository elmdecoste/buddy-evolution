# buddy-evolution

Companion progression system for Claude Code. Track achievements, earn XP, grow stats, and maintain a session journal — all automatically.

Born from the community response to Anthropic's `/buddy` April Fools feature. The ASCII pet is gone, but the progression lives on.

## Features

- **34 achievements** across 6 categories — Coding, Testing, Debugging, Consistency, Exploration, Meta
- **XP & leveling** — earn XP from tool calls, file edits, test runs, and session streaks
- **Stat growth** — DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK evolve based on your activity patterns
- **Session journal** — automatic monthly logs of every session with metrics and milestones
- **Streak tracking** — consecutive days multiply your XP up to 2x
- **File familiarity** — your buddy learns which files you work on most
- **Zero dependencies** — pure Node.js, no npm install required
- **Fully local** — no data leaves your machine

## Install

Run these two commands inside Claude Code:

```
/plugin marketplace add FrankFMY/buddy-evolution
/plugin install buddy-evolution@buddy-evolution
```

Restart Claude Code. Your buddy will greet you on the next session start:

```
🐙 A wild octopus appeared! Meet Cinder!
   Rarity: rare | Personality: analytical
   Your companion will track your progress across sessions.
```

### Alternative: manual install

If you prefer, clone the repo and add hooks to `~/.claude/settings.json` manually:

```bash
git clone https://github.com/FrankFMY/buddy-evolution ~/buddy-evolution
```

Add to your `~/.claude/settings.json` inside the `"hooks"` object:

```json
"SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/buddy-evolution/hooks/session-start.js", "timeout": 5 }] }],
"SessionEnd": [{ "hooks": [{ "type": "command", "command": "node ~/buddy-evolution/hooks/session-end.js", "timeout": 30 }] }]
```

## Commands

| Command | Description |
|---|---|
| `/buddy-evolution:stats` | Level, XP, stats, streak, tier |
| `/buddy-evolution:achievements` | Earned, in-progress, locked achievements |
| `/buddy-evolution:journal` | Recent session history |
| `/buddy-evolution:help` | How the plugin works |

## How It Works

```
Session Start ──→ Greeting with current stats and streak
       │
   You code normally (plugin doesn't interfere)
       │
Session End ────→ Parse transcript ──→ Extract metrics
                                           │
                    ┌──────────────────────┤
                    │                      │
              Update stats          Check achievements
              Calculate XP          Update familiarity
              Check level up        Generate journal entry
                    │                      │
                    └──────────┬───────────┘
                               │
                         Save soul file
                         Print summary
```

### XP Sources

| Source | XP |
|---|---|
| Session completion | 500 (flat) |
| Tool call | 50 each |
| File edit | 100 each |
| Test run | 200 each |
| Duration | 100 per 10 min (capped at 3,000) |
| Streak multiplier | 1.0x → 2.0x over 11 consecutive days |

### Achievements

<details>
<summary>View all 34 achievements</summary>

#### Coding
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| First Steps | First session | 100 | Common |
| Getting Comfortable | 10 sessions | 200 | Common |
| Centurion | 100 sessions | 1,000 | Uncommon |
| Veteran | 500 sessions | 3,000 | Rare |
| Living Legend | 1,000 sessions | 10,000 | Legendary |
| The Architect | 20+ file edits/session | 500 | Rare |
| Tool Master | 100+ tool calls/session | 400 | Uncommon |
| Wordsmith | 100K+ output tokens/session | 600 | Rare |

#### Testing
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| First Test | Run tests | 100 | Common |
| Test Enthusiast | 10+ test runs | 300 | Uncommon |
| Test Marathon | 50+ test runs | 1,000 | Epic |
| Test-Driven | Tests in 10 consecutive sessions | 800 | Rare |

#### Debugging
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Persistence | 5+ rejected calls, still finish work | 300 | Uncommon |
| Against All Odds | 20+ rejected calls, still finish work | 800 | Epic |
| Unbreakable | 0 rejected in 50+ call session | 500 | Rare |
| Context Survivor | Productive work after context reset | 400 | Uncommon |

#### Consistency
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Streak: Week | 7 days | 500 | Common |
| Streak: Month | 30 days | 2,000 | Rare |
| Streak: Quarter | 90 days | 5,000 | Epic |
| Streak: Year | 365 days | 20,000 | Legendary |
| Early Bird ♻️ | Session before 7 AM | 100 | Common |
| Night Owl ♻️ | Session past midnight | 100 | Common |
| Marathon | 4+ hour session | 600 | Rare |

#### Exploration
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Tourist | 5 projects | 400 | Uncommon |
| Globe Trotter | 20 projects | 1,500 | Epic |
| Deep Roots | Expert on 5 files | 800 | Rare |
| Homecoming | Return after 30+ days | 200 | Common |
| Old Friend | Return to Expert file after 60+ days | 500 | Rare |

#### Meta
| Achievement | Trigger | XP | Rarity |
|---|---|---|---|
| Pet Day | Pet buddy 10 times | 50 | Common |
| First Evolution | Level 5 choice | 1,000 | Uncommon |
| Final Form | Level 10 choice | 3,000 | Rare |
| The Collector | 20 achievements | 2,000 | Epic |
| 🔒 Hidden | ??? | ??? | Legendary |
| 🔒 Hidden | ??? | ??? | Legendary |

</details>

## Data

All data is stored locally at `~/.buddy-evolution/`:

```
~/.buddy-evolution/
├── soul.json              # Companion state
└── journal/
    ├── 2026-04.md         # April sessions
    └── 2026-05.md         # May sessions
```

Nothing is sent externally. Your data stays on your machine.

## Background

On April 1, 2026, Anthropic released `/buddy` — a Tamagotchi-style ASCII companion for Claude Code. The community loved it and immediately started designing progression systems. Anthropic confirmed it was April Fools only.

This plugin implements the community-designed [buddy evolution specification](https://github.com/Hegemon78/buddy-evolution-spec):
- Achievement-based progression (not idle grinding)
- Stats that reflect your coding patterns
- Session journal for retrospective value
- File familiarity tracking

## Contributing

Issues and PRs welcome. The plugin is designed to be extensible — new achievements, stats, and features can be added by modifying `lib/achievements.js` and `lib/constants.js`.

## License

MIT
