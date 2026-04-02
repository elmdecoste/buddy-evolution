#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const libDir = path.join(__dirname, '..', 'lib');
const { loadSoul, saveSoul } = require(path.join(libDir, 'soul'));
const { calculateSessionXP, checkLevelUp, getXPForNextLevel, formatProgressBar } = require(path.join(libDir, 'xp'));
const { LEVEL_THRESHOLDS } = require(path.join(libDir, 'constants'));

const DATA_DIR = path.join(os.homedir(), '.buddy-evolution');
const OFFSET_PATH = path.join(DATA_DIR, 'session-offset.json');

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let hookData = {};
  try { hookData = JSON.parse(input); } catch {}

  const transcriptPath = hookData.transcript_path || hookData.transcriptPath;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  const soul = loadSoul();
  if (!soul) process.exit(0);

  // Load the byte offset from last time we processed this transcript
  let offset = 0;
  try {
    const saved = JSON.parse(fs.readFileSync(OFFSET_PATH, 'utf-8'));
    if (saved.transcriptPath === transcriptPath) {
      offset = saved.offset || 0;
    }
  } catch {}

  // Read only the new bytes from the transcript
  const stat = fs.statSync(transcriptPath);
  if (stat.size <= offset) {
    // Nothing new
    process.exit(0);
  }

  const fd = fs.openSync(transcriptPath, 'r');
  const buf = Buffer.alloc(stat.size - offset);
  fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);

  const newContent = buf.toString('utf-8');
  const lines = newContent.split('\n').filter(l => l.trim());

  // Count tool calls in the new content
  let toolCalls = 0;
  let fileEdits = 0;
  let testRuns = 0;
  let bashCalls = 0;
  let readCalls = 0;
  let grepCalls = 0;

  const { TEST_PATTERNS } = require(path.join(libDir, 'constants'));

  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    const message = entry.message || {};
    const content = Array.isArray(message.content) ? message.content : [];

    for (const block of content) {
      if (!block || block.type !== 'tool_use') continue;

      const toolName = block.name || '';
      const toolInput = block.input || {};
      toolCalls++;

      if (toolName === 'Bash') {
        bashCalls++;
        const cmd = toolInput.command || '';
        if (TEST_PATTERNS.some(p => p.test(cmd))) testRuns++;
      } else if (toolName === 'Write' || toolName === 'Edit') {
        fileEdits++;
      } else if (toolName === 'Read') {
        readCalls++;
      } else if (toolName === 'Grep' || toolName === 'Glob') {
        grepCalls++;
      }
    }
  }

  // Skip if nothing happened
  if (toolCalls === 0) {
    // Still save offset so we don't re-scan
    try {
      fs.writeFileSync(OFFSET_PATH, JSON.stringify({ transcriptPath, offset: stat.size }));
    } catch {}
    process.exit(0);
  }

  // Calculate XP for just these new tool calls (no session flat bonus — that's for SessionEnd)
  const turnMetrics = { toolCalls, fileEdits, testRuns, durationMinutes: 0 };
  const turnXP = (toolCalls * 5) + (fileEdits * 15) + (testRuns * 30);

  if (turnXP === 0) {
    try {
      fs.writeFileSync(OFFSET_PATH, JSON.stringify({ transcriptPath, offset: stat.size }));
    } catch {}
    process.exit(0);
  }

  // Apply XP
  const levelBefore = soul.progression.level;
  soul.progression.totalXP += turnXP;

  // Update lifetime counters
  soul.lifetime.toolCalls += toolCalls;
  soul.lifetime.fileEdits += fileEdits;
  soul.lifetime.testRuns += testRuns;
  soul.lifetime.bashCalls += bashCalls;
  soul.lifetime.readCalls += readCalls;
  soul.lifetime.grepCalls += grepCalls;

  // Check level up
  const levelResult = checkLevelUp(soul);

  // Save
  saveSoul(soul);

  // Save new offset
  try {
    fs.writeFileSync(OFFSET_PATH, JSON.stringify({ transcriptPath, offset: stat.size }));
  } catch {}

  // Print XP gain to stderr
  const emoji = soul.identity.emoji || '🐾';
  const nextXP = getXPForNextLevel(soul.progression.level);
  const currentLevelXP = LEVEL_THRESHOLDS[soul.progression.level - 1] || 0;
  const bar = nextXP
    ? formatProgressBar(soul.progression.totalXP - currentLevelXP, nextXP - currentLevelXP, 10)
    : '██████████';

  let line = `${emoji} +${turnXP} XP  Lv${soul.progression.level} ${bar} ${soul.progression.totalXP.toLocaleString('en-US')}/${(nextXP || soul.progression.totalXP).toLocaleString('en-US')}`;

  if (levelResult.leveledUp) {
    line += `  🎉 Level up! ${levelResult.oldLevel} → ${levelResult.newLevel}`;
  }
  if (soul.progression.level >= 20 && (soul.progression.prestige || 0) < 9) {
    line += `  ✧ MAX! /buddy-evolution:prestige to ascend`;
  }

  process.stderr.write(line + '\n');
  process.exit(0);
}

main().catch(() => process.exit(0));
