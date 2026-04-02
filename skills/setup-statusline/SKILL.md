---
name: setup-statusline
description: Install and configure the buddy-evolution statusline in Claude Code. Use when the user wants to set up, install, enable, or fix their buddy statusline display.
---

# Setup Buddy Statusline

This skill configures the buddy-evolution animated statusline in Claude Code's settings.

## What you need to do

Add a `statusLine` entry to `~/.claude/settings.json` that runs the statusline script from the plugin cache.

### Step 1: Read the current settings

Read `~/.claude/settings.json` to see what's already configured.

### Step 2: Add or update the statusLine entry

The `statusLine` config should be a top-level key in settings.json:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node \"$(ls -td ~/.claude/plugins/cache/buddy-evolution/buddy-evolution/*/ 2>/dev/null | head -1)statusline/index.js\"'"
  }
}
```

**Important details:**
- The `ls -td` pattern finds the latest cached version of the plugin automatically — do NOT hardcode a version number
- The command must be wrapped in `bash -c '...'` because it uses shell expansion
- If `statusLine` already exists in settings.json, replace it with this value
- Do NOT remove or modify any other settings — only add/update the `statusLine` key
- Use the Edit tool to make the change, not a full file rewrite

### Step 3: Verify

After editing, read back `~/.claude/settings.json` to confirm the change looks correct. Then tell the user:

> Statusline installed! Restart Claude Code (or start a new session) to see your buddy in the status bar.

### Troubleshooting

If the user reports the statusline isn't working:
1. Check that `~/.buddy-evolution/soul.json` exists (the buddy must be initialized via at least one session)
2. Check that the plugin cache has the statusline script: `ls ~/.claude/plugins/cache/buddy-evolution/buddy-evolution/*/statusline/index.js`
3. Verify `settings.json` has the correct `statusLine` entry
