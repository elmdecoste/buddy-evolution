#!/usr/bin/env node
'use strict';

const path = require('path');

const libDir = path.join(__dirname, '..', 'lib');
const { loadSoul, saveSoul, getSpeciesInfo } = require(path.join(libDir, 'soul'));
const { parseTranscript } = require(path.join(libDir, 'transcript'));
const { calculateSessionXP, updateStreak, checkLevelUp, applyStatGrowth, getXPForNextLevel, formatProgressBar } = require(path.join(libDir, 'xp'));
const { checkAchievements, updateProgress, updateTestDrivenStreak } = require(path.join(libDir, 'achievements'));
const { generateEntry, appendJournal, checkWeeklySummary } = require(path.join(libDir, 'journal'));
const { sendNotification } = require(path.join(libDir, 'notify'));

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let hookData = {};
  try { hookData = JSON.parse(input); } catch {}

  const soul = loadSoul();
  if (!soul) {
    process.exit(0);
  }

  const transcriptPath = hookData.transcript_path || hookData.transcriptPath;
  const projectDir = hookData.cwd || '';

  // 1. Parse transcript
  const session = await parseTranscript(transcriptPath);
  session.projectDir = projectDir;

  // Skip empty sessions
  if (session.toolCalls === 0 && session.durationMinutes < 1) {
    process.exit(0);
  }

  // Save level before changes for lastSession diff
  const levelBefore = soul.progression.level;

  // 2. Update lifetime metrics
  soul.lifetime.sessions++;
  soul.lifetime.durationMinutes += session.durationMinutes;
  soul.lifetime.toolCalls += session.toolCalls;
  soul.lifetime.rejectedToolCalls += session.rejectedToolCalls;
  soul.lifetime.fileEdits += session.fileEdits;
  soul.lifetime.testRuns += session.testRuns;
  soul.lifetime.bashCalls += session.bashCalls;
  soul.lifetime.readCalls += session.readCalls;
  soul.lifetime.grepCalls += session.grepCalls;

  // 3. Update streak
  const today = new Date().toISOString().slice(0, 10);
  updateStreak(soul, today);

  // 4. Apply stat growth with diminishing returns
  applyStatGrowth(soul, session);

  // 5. Update familiarity + per-project XP
  updateFamiliarity(soul, session);

  // 6. Update test-driven streak
  updateTestDrivenStreak(soul, session);

  // 7. Check weekly summary (before achievements, so it's in the journal before today's entry)
  checkWeeklySummary(soul);

  // 8. Check achievements
  const newAchievements = checkAchievements(session, soul);

  // 9. Calculate XP (session + achievement bonuses)
  const sessionXP = calculateSessionXP(session, soul.streak.currentDays);
  const achievementXP = newAchievements.reduce((sum, a) => sum + a.xp, 0);
  const totalXP = sessionXP + achievementXP;
  soul.progression.totalXP += totalXP;

  // 10. Track per-project XP
  if (projectDir && soul.familiarity[projectDir]) {
    soul.familiarity[projectDir].xpEarned = (soul.familiarity[projectDir].xpEarned || 0) + totalXP;
  }

  // 11. Check level up
  const levelResult = checkLevelUp(soul);

  // 12. Update achievement progress
  updateProgress(soul);

  // 13. Save lastSession for next greeting
  soul.lastSession = {
    date: today,
    xp: totalXP,
    achievements: newAchievements.map(a => a.name),
    levelBefore,
    levelAfter: soul.progression.level,
  };

  // 14. Save soul
  saveSoul(soul);

  // 15. Generate and append journal entry
  const entry = generateEntry(session, soul, newAchievements, totalXP, levelResult);
  appendJournal(entry);

  // 16. Desktop notifications for achievements
  for (const a of newAchievements) {
    sendNotification(`🏆 ${a.name}`, `${a.description} (+${a.xp.toLocaleString('en-US')} XP)`);
  }

  // 17. Print summary to stderr with progress bar
  const species = getSpeciesInfo(soul);
  const emoji = species?.emoji || '🐾';
  const nextXP = getXPForNextLevel(soul.progression.level);
  const bar = nextXP
    ? formatProgressBar(soul.progression.totalXP - (require(path.join(libDir, 'constants')).LEVEL_THRESHOLDS[soul.progression.level - 1] || 0), nextXP - (require(path.join(libDir, 'constants')).LEVEL_THRESHOLDS[soul.progression.level - 1] || 0))
    : '████████████████████';

  const lines = [
    `${emoji} Session complete! +${totalXP.toLocaleString('en-US')} XP`,
    `   Level ${soul.progression.level} ${bar} ${soul.progression.totalXP.toLocaleString('en-US')} / ${(nextXP || soul.progression.totalXP).toLocaleString('en-US')} XP`,
  ];

  if (levelResult.leveledUp) {
    lines.push(`   🎉 Level up! ${levelResult.oldLevel} → ${levelResult.newLevel}`);
  }
  if (levelResult.tierChanged) {
    lines.push(`   ✨ Tier up! ${levelResult.oldTier} → ${levelResult.newTier}`);
  }
  for (const a of newAchievements) {
    lines.push(`   🏆 ${a.name} — ${a.description} (+${a.xp.toLocaleString('en-US')} XP)`);
  }

  process.stderr.write(lines.join('\n') + '\n');
  process.exit(0);
}

function updateFamiliarity(soul, session) {
  const projectDir = session.projectDir;
  if (!projectDir) return;

  if (!soul.familiarity[projectDir]) {
    soul.familiarity[projectDir] = { sessions: 0, files: {}, xpEarned: 0 };
  }

  const project = soul.familiarity[projectDir];
  project.sessions++;

  const today = new Date().toISOString().slice(0, 10);
  const editedFiles = session.filesEditedList || [];

  for (const filePath of editedFiles) {
    if (!project.files[filePath]) {
      project.files[filePath] = { touches: 0, last: null };
    }
    project.files[filePath].touches++;
    project.files[filePath].last = today;
  }
}

main().catch(err => {
  process.stderr.write(`[buddy-evolution] session-end error: ${err.message}\n`);
  process.exit(0);
});
