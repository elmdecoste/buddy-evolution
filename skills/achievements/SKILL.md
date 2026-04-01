---
name: achievements
description: Show buddy companion achievements — earned, in-progress, locked, and hidden. Use when the user asks about achievements, unlocks, progress, or milestones.
---

# Buddy Achievements

Read the buddy soul file and display achievements organized by status.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. If the file doesn't exist, tell the user to start a new session first
3. Categorize achievements and format as shown below

## Achievement catalog (34 total, 2 hidden)

### Coding
| ID | Name | Trigger | XP | Rarity |
|---|---|---|---|---|
| first_steps | First Steps | Complete first session | 100 | Common |
| getting_comfortable | Getting Comfortable | 10 sessions | 200 | Common |
| centurion | Centurion | 100 sessions | 1,000 | Uncommon |
| veteran | Veteran | 500 sessions | 3,000 | Rare |
| living_legend | Living Legend | 1,000 sessions | 10,000 | Legendary |
| the_architect | The Architect | 20+ file edits in one session | 500 | Rare |
| tool_master | Tool Master | 100+ tool calls in one session | 400 | Uncommon |
| wordsmith | Wordsmith | 100K+ output tokens in one session | 600 | Rare |

### Testing
| ID | Name | Trigger | XP | Rarity |
|---|---|---|---|---|
| first_test | First Test | Run tests in a session | 100 | Common |
| test_enthusiast | Test Enthusiast | 10+ test runs | 300 | Uncommon |
| test_marathon | Test Marathon | 50+ test runs | 1,000 | Epic |
| test_driven | Test-Driven | Tests in 10 consecutive sessions | 800 | Rare |

### Debugging
| ID | Name | Trigger | XP | Rarity |
|---|---|---|---|---|
| persistence | Persistence | 5+ rejected calls, still finish work | 300 | Uncommon |
| against_all_odds | Against All Odds | 20+ rejected calls, still finish work | 800 | Epic |
| unbreakable | Unbreakable | 0 rejected in 50+ call session | 500 | Rare |
| context_survivor | Context Survivor | Productive work after context reset | 400 | Uncommon |

### Consistency
| ID | Name | Trigger | XP | Rarity |
|---|---|---|---|---|
| streak_week | Streak: Week | 7 consecutive days | 500 | Common |
| streak_month | Streak: Month | 30 consecutive days | 2,000 | Rare |
| streak_quarter | Streak: Quarter | 90 consecutive days | 5,000 | Epic |
| streak_year | Streak: Year | 365 consecutive days | 20,000 | Legendary |
| early_bird | Early Bird ♻️ | Session before 7 AM | 100 | Common |
| night_owl | Night Owl ♻️ | Session past midnight | 100 | Common |
| marathon | Marathon | 4+ hour session | 600 | Rare |

### Exploration
| ID | Name | Trigger | XP | Rarity |
|---|---|---|---|---|
| tourist | Tourist | 5 different projects | 400 | Uncommon |
| globe_trotter | Globe Trotter | 20 different projects | 1,500 | Epic |
| deep_roots | Deep Roots | Expert familiarity on 5 files | 800 | Rare |
| homecoming | Homecoming | Return to file after 30+ days | 200 | Common |
| old_friend | Old Friend | Return to Expert file after 60+ days | 500 | Rare |

### Meta
| ID | Name | Trigger | XP | Rarity |
|---|---|---|---|---|
| pet_day | Pet Day | Pet buddy 10 times | 50 | Common |
| first_evolution | First Evolution | Level 5 evolution choice | 1,000 | Uncommon |
| final_form | Final Form | Level 10 evolution choice | 3,000 | Rare |
| the_collector | The Collector | Earn 20 achievements | 2,000 | Epic |
| 🔒 | ??? | Hidden | ??? | Legendary |
| 🔒 | ??? | Hidden | ??? | Legendary |

## Output format

```
🏆 Achievements — {earned_count}/32 earned

Recent:
  ✅ {name} — {description} (+{xp} XP)

In Progress:
  ⬜ {name} ········· {current}/{target}

Locked:
  🔒 {name} — {description}

🔒 {hidden_count} hidden achievements undiscovered
```

## Rules

- Show "Recent" = last 3 earned achievements (sorted by date, newest first)
- Show "In Progress" = achievements with partial progress data in soul.achievements.progress
- Show "Locked" = first 5 unearned non-hidden achievements sorted by rarity (common first)
- Hidden achievements: only show if earned. If not earned, show as "🔒 ??? — Hidden"
- Count in header: X/32 (32 = total non-hidden achievements)
- ♻️ marks repeatable achievements
