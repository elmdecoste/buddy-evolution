#!/usr/bin/env node
'use strict';

const path = require('path');

// Resolve lib from plugin root (hooks/ is one level deep)
const libDir = path.join(__dirname, '..', 'lib');
const { ensureDataDir, loadSoul, createSoul, getSpeciesInfo } = require(path.join(libDir, 'soul'));
const { getStreakMultiplier, updateStreak, getXPForNextLevel } = require(path.join(libDir, 'xp'));

async function main() {
  // Read hook input from stdin
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let hookData = {};
  try { hookData = JSON.parse(input); } catch {}

  ensureDataDir();
  let soul = loadSoul();
  let isFirstRun = false;

  if (!soul) {
    soul = createSoul();
    isFirstRun = true;
  }

  // Update streak on session start (so greeting shows current streak)
  const today = new Date().toISOString().slice(0, 10);
  updateStreak(soul, today);

  const species = getSpeciesInfo(soul);
  const emoji = species?.emoji || '🐾';
  const streakMult = getStreakMultiplier(soul.streak.currentDays);
  const streakStr = streakMult > 1.0 ? ` (🔥 ${streakMult.toFixed(1)}x)` : '';
  const nextLevelXP = getXPForNextLevel(soul.progression.level);
  const xpStr = nextLevelXP
    ? `${soul.progression.totalXP.toLocaleString('en-US')} / ${nextLevelXP.toLocaleString('en-US')} XP`
    : `${soul.progression.totalXP.toLocaleString('en-US')} XP (MAX)`;

  let greeting;
  if (isFirstRun) {
    greeting = [
      `${emoji} A wild ${soul.identity.species} appeared! Meet ${soul.identity.name}!`,
      `   Rarity: ${soul.identity.rarity} | Personality: ${soul.identity.personality}`,
      `   Your companion will track your progress across sessions.`,
      `   Type /buddy-evolution:help to learn more.`,
    ].join('\n');
  } else {
    const tier = soul.progression.tier.charAt(0).toUpperCase() + soul.progression.tier.slice(1);
    const dayWord = soul.streak.currentDays === 1 ? 'day' : 'days';
    greeting = `${emoji} ${soul.identity.name} welcomes you! Level ${soul.progression.level} ${tier} | Streak: ${soul.streak.currentDays} ${dayWord}${streakStr} | ${xpStr}`;
  }

  // Output greeting to stderr (visible to user)
  process.stderr.write(greeting + '\n');

  // Output context for Claude via stdout JSON
  const context = [
    `Buddy companion: ${soul.identity.name} the ${soul.identity.species} (${soul.identity.rarity}, ${soul.identity.personality}).`,
    `Level ${soul.progression.level} ${soul.progression.tier}. ${xpStr}.`,
    `Streak: ${soul.streak.currentDays} ${soul.streak.currentDays === 1 ? 'day' : 'days'}.`,
    `Sessions: ${soul.lifetime.sessions}.`,
  ].join(' ');

  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

main().catch(err => {
  process.stderr.write(`[buddy-evolution] session-start error: ${err.message}\n`);
  process.exit(0); // Don't block session on errors
});
