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

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function checkWeeklySummary(soul) {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  if (!soul.weeklySnapshot) {
    soul.weeklySnapshot = {
      week: currentWeek,
      year: currentYear,
      xp: soul.progression.totalXP,
      sessions: soul.lifetime.sessions,
      achievements: soul.achievements.earned.length,
    };
    return;
  }

  const snap = soul.weeklySnapshot;
  if (snap.week === currentWeek && snap.year === currentYear) {
    return; // Same week, no summary needed
  }

  // New week — generate summary from last week's delta
  const deltaXP = soul.progression.totalXP - (snap.xp || 0);
  const deltaSessions = soul.lifetime.sessions - (snap.sessions || 0);
  const deltaAchievements = soul.achievements.earned.length - (snap.achievements || 0);

  if (deltaSessions > 0) {
    // Find most active project this period
    let topProject = 'unknown';
    let topSessions = 0;
    for (const [dir, data] of Object.entries(soul.familiarity)) {
      if (data.sessions > topSessions) {
        topSessions = data.sessions;
        topProject = path.basename(dir);
      }
    }

    const summary = [
      `## 📊 Week ${snap.week} Summary`,
      `**Sessions:** ${deltaSessions} | **XP earned:** ${deltaXP.toLocaleString('en-US')} | **Achievements:** ${deltaAchievements}`,
      `**Most active project:** ${topProject}`,
      `**Total progress:** Level ${soul.progression.level} | ${soul.progression.totalXP.toLocaleString('en-US')} XP | ${soul.achievements.earned.length} achievements`,
      '',
      '---',
      '',
    ].join('\n');

    appendJournal(summary);
  }

  // Update snapshot for new week
  soul.weeklySnapshot = {
    week: currentWeek,
    year: currentYear,
    xp: soul.progression.totalXP,
    sessions: soul.lifetime.sessions,
    achievements: soul.achievements.earned.length,
  };
}

function formatDuration(minutes) {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

module.exports = { generateEntry, appendJournal, formatDuration, checkWeeklySummary };
