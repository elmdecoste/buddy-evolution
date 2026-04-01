---
name: evolve
description: Choose an evolution path for your buddy companion. Use when the user wants to evolve their buddy, choose an evolution path, or asks about evolution options.
---

# Buddy Evolution

Help the user choose an evolution path for their companion.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. Check eligibility:
   - **Level 5+ with empty evolutionPath**: Offer first evolution choice (Path A vs Path B)
   - **Level 10+ with 1 entry in evolutionPath**: Offer second evolution choice (sub-path 1 vs 2)
   - **Already has 2 entries**: Tell the user their buddy has reached final form
   - **Below Level 5**: Tell the user they need Level 5 to evolve (show current level and XP needed)

3. Present species-specific choices. Read the species from `identity.species` and look up paths below.

## Evolution Paths by Species

| Species | Path A | Path B | A1 | A2 | B1 | B2 |
|---|---|---|---|---|---|---|
| duck | Scholar | Prankster | Sage | Librarian | Jester | Trickster |
| goose | Guardian | Chaos Agent | Sentinel | Warden | Maverick | Anarchist |
| blob | Shapeshifter | Absorber | Mimic | Phantom | Titan | Void |
| snail | Hermit | Explorer | Sage | Monk | Pioneer | Nomad |
| cat | Shadow | Familiar | Phantom | Assassin | Oracle | Enchanter |
| rabbit | Scout | Burrower | Ranger | Speedster | Architect | Keeper |
| owl | Sage | Hunter | Oracle | Archivist | Stalker | Raptor |
| penguin | Emperor | Diver | Commander | Diplomat | Depths Walker | Ice Breaker |
| turtle | Scholar | Trickster | Ancient Sage | Librarian | Jester | Phantom |
| octopus | Strategist | Artist | Mastermind | Admiral | Illusionist | Sculptor |
| axolotl | Healer | Mutant | Restorer | Alchemist | Chimera | Adaptor |
| ghost | Specter | Poltergeist | Wraith | Ethereal | Haunter | Banshee |
| robot | Optimizer | Rebel | Singularity | Processor | Rogue AI | Liberator |
| dragon | Elder | Storm | Ancient | Wyrm | Tempest | Inferno |
| capybara | Zen Master | Social King | Enlightened | Meditator | Leader | Connector |
| mushroom | Mycelium | Sporeborn | Network | Root Mind | Sporeling | Bloom |
| cactus | Sentinel | Bloom | Ironwall | Desert King | Oasis | Flower |
| chonk | Titan | Gentle Giant | Colossus | Juggernaut | Protector | Hugger |

## First evolution (Level 5)

Present like this:
```
{emoji} {name} is ready to evolve!

Choose a path — this is permanent:

  [A] {Path A} — {brief personality description}
  [B] {Path B} — {brief personality description}
```

When user chooses, edit soul.json:
- Add the chosen path name to `progression.evolutionPath` array
- Example: if they choose A for octopus, set `evolutionPath: ["Strategist"]`

## Second evolution (Level 10)

If evolutionPath has 1 entry, offer the sub-paths. For example, if octopus chose "Strategist" (A):
```
  [1] Mastermind — calculated, always three steps ahead
  [2] Admiral — commanding, leads from the front
```

Add to evolutionPath: `["Strategist", "Mastermind"]`

## After choosing

Confirm: "{emoji} {name} evolved into a {path_name}! This shapes their personality going forward."

## Rules

- Evolution choices are permanent — warn the user before confirming
- Only edit the `progression.evolutionPath` array — do not modify other fields
- If file doesn't exist, tell user to start a session first
