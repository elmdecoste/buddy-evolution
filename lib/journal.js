'use strict';

const fs = require('fs');
const path = require('path');
const { JOURNAL_DIR } = require('./constants');
const { getStreakMultiplier } = require('./xp');

function generateEntry(session, soul, newAchievements, xpGained, levelResult) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const projectName = session.projectDir
    ? path.basename(session.projectDir)
    : 'unknown';

  const duration = formatDuration(session.durationMinutes);
  const streakMult = getStreakMultiplier(soul.streak.currentDays);
  const streakStr = streakMult > 1.0 ? ` (${streakMult.toFixed(1)}x)` : '';

  let lines = [
    `## ${date} — Session #${soul.lifetime.sessions}`,
    `**Project:** ${projectName}`,
    `**Duration:** ${duration} | **Tools:** ${session.toolCalls} calls | **Files:** ${session.fileEdits} edited`,
  ];

  if (session.testRuns > 0) {
    lines.push(`**Tests:** ${session.testRuns} runs`);
  }

  lines.push(`**Streak:** Day ${soul.streak.currentDays}${streakStr}`);
  lines.push(`**XP:** +${xpGained.toLocaleString('en-US')} | **Level:** ${levelResult.oldLevel} → ${levelResult.newLevel}`);

  if (levelResult.leveledUp) {
    lines.push(`**Level Up!** ${levelResult.oldLevel} → ${levelResult.newLevel}`);
  }

  if (levelResult.tierChanged) {
    lines.push(`**Tier Up!** ${levelResult.oldTier} → ${levelResult.newTier}`);
  }

  for (const achievement of newAchievements) {
    lines.push(`**Achievement:** 🏆 ${achievement.name} — ${achievement.description} (+${achievement.xp.toLocaleString('en-US')} XP)`);
  }

  lines.push('');
  return lines.join('\n');
}

function appendJournal(entry) {
  fs.mkdirSync(JOURNAL_DIR, { recursive: true });
  const now = new Date();
  const filename = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.md`;
  const filepath = path.join(JOURNAL_DIR, filename);

  // Add header if file doesn't exist
  if (!fs.existsSync(filepath)) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const header = `# Journal — ${monthNames[now.getMonth()]} ${now.getFullYear()}\n\n`;
    fs.writeFileSync(filepath, header, 'utf-8');
  }

  fs.appendFileSync(filepath, entry + '\n', 'utf-8');
}

function formatDuration(minutes) {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

module.exports = { generateEntry, appendJournal, formatDuration };
