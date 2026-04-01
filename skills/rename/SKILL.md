---
name: rename
description: Rename your buddy companion. Use when the user wants to change their buddy's name, rename their companion, or give their buddy a new name.
---

# Rename Buddy

Let the user rename their companion.

## Instructions

1. Read `~/.buddy-evolution/soul.json`
2. Show the current name: "Your buddy is currently named **{name}** the {species}."
3. Ask the user: "What would you like to name them?"
4. When the user responds with a new name, edit `~/.buddy-evolution/soul.json` — change the `identity.name` field to the new name
5. Confirm: "Renamed **{oldName}** → **{newName}**! Your {species} will respond to their new name starting next session."

## Rules

- Only change the `name` field in `identity` — do not modify any other fields
- Accept any name the user provides (it's their buddy)
- If the file doesn't exist, tell the user to start a new session first
