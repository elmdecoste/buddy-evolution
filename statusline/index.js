#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Data paths ──────────────────────────────────────────────────────
const DATA_DIR = path.join(os.homedir(), '.buddy-evolution');
const SOUL_PATH = path.join(DATA_DIR, 'soul.json');
const NPC_STATE_PATH = path.join(DATA_DIR, 'npc-state.json');

// ── Grid dimensions ─────────────────────────────────────────────────
const TRACK_W = 20;
const TRACK_H = 3;
const WALK_SPEED_MS = 400;    // ms per grid step
const IDLE_MIN_MS = 5000;
const IDLE_MAX_MS = 10000;

// ── ANSI helpers ────────────────────────────────────────────────────
const dim    = s => `\x1b[2m${s}\x1b[22m`;
const bold   = s => `\x1b[1m${s}\x1b[22m`;
const cyan   = s => `\x1b[36m${s}\x1b[39m`;
const yellow = s => `\x1b[33m${s}\x1b[39m`;
const green  = s => `\x1b[32m${s}\x1b[39m`;

// ── Vibe messages by personality ────────────────────────────────────
const VIBE_MESSAGES = {
  curious: [
    'what does that do?', 'ooh, interesting...', 'hmm, I wonder...',
    'tell me more!', 'what if we try...', '*takes notes*',
    'fascinating!', 'why though?', '*peers at code*', 'neat!',
  ],
  mischievous: [
    'hehe', '*knocks over stack*', 'oops', 'blame the compiler',
    'ship it!', 'yolo', '*hides bug*', 'works on my machine',
    'what tests?', 'git push --force',
  ],
  stoic: [
    '...', '*nods*', 'acceptable.', 'proceed.', 'indeed.',
    'patience.', '*meditates*', 'this too shall compile.', 'steady.', 'hmm.',
  ],
  cheerful: [
    'yay!', 'you got this!', 'woohoo!', 'great work!', '*happy dance*',
    'let\'s go!', 'amazing!', '*sparkles*', 'keep it up!', 'so cool!',
  ],
  snarky: [
    'oh, this again?', 'sure, that\'ll work', '*sigh*', 'bold move.',
    'interesting choice...', 'you sure about that?', 'lol ok',
    '*raises eyebrow*', 'classic.', 'riveting.',
  ],
  default: [
    'vibing...', '*stretches*', 'zzz...', '*yawns*', 'coding time!',
    ':)', '*watches*', 'nice.', '*blinks*', 'sup',
  ],
};

// ── XP bar ──────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [
  0, 1000, 3000, 6000, 10000, 16000, 24000, 35000, 50000, 70000,
  95000, 125000, 160000, 200000, 250000, 310000, 380000, 460000, 550000, 650000,
];

function getXPProgress(level, totalXP) {
  const cur = LEVEL_THRESHOLDS[level - 1] || 0;
  const nxt = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const inLevel = totalXP - cur;
  const needed = nxt - cur;
  return { inLevel, needed, pct: Math.min(1, inLevel / needed) };
}

function renderXPBar(pct, width) {
  const filled = Math.round(pct * width);
  return green('█'.repeat(filled)) + dim('░'.repeat(width - filled));
}

// ── Deterministic hash ──────────────────────────────────────────────
function hashInt(n) {
  n = ((n >>> 0) * 2654435761) >>> 0;
  return n;
}

// ── NPC state machine (time-projected) ──────────────────────────────
// Instead of stepping on each invocation, we store waypoints and
// calculate the current position based on wall-clock time.
// This works correctly even if the script only runs on events.

function loadNpcState() {
  try {
    return JSON.parse(fs.readFileSync(NPC_STATE_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function saveNpcState(state) {
  try {
    fs.writeFileSync(NPC_STATE_PATH, JSON.stringify(state));
  } catch { /* best effort */ }
}

function pickTarget(seed, avoidX, avoidY) {
  const h1 = hashInt(seed);
  const h2 = hashInt(seed + 7919);
  let tx = h1 % TRACK_W;
  let ty = h2 % TRACK_H;
  if (Math.abs(tx - avoidX) < 3) {
    tx = (tx + 6 + (h1 % 8)) % TRACK_W;
  }
  return { tx, ty };
}

function pickIdleDuration(seed) {
  return IDLE_MIN_MS + (hashInt(seed) % (IDLE_MAX_MS - IDLE_MIN_MS));
}

// Calculate how many steps to walk from (sx,sy) to (tx,ty)
function stepsNeeded(sx, sy, tx, ty) {
  return Math.max(Math.abs(tx - sx), Math.abs(ty - sy));
}

// Interpolate position along a walk from (sx,sy) to (tx,ty) at step n
function posAtStep(sx, sy, tx, ty, step, totalSteps) {
  if (totalSteps === 0) return { x: tx, y: ty };
  const t = Math.min(step, totalSteps) / totalSteps;
  const x = Math.round(sx + (tx - sx) * t);
  const y = Math.round(sy + (ty - sy) * t);
  return { x, y };
}

function resolveNpcPosition(now) {
  let state = loadNpcState();

  // Initialize
  if (!state || typeof state.startX !== 'number') {
    const initX = Math.floor(TRACK_W / 2);
    const initY = 1;
    const { tx, ty } = pickTarget(now, initX, initY);
    const idle = pickIdleDuration(now);
    state = {
      // Current segment: idle at start, then walk to first target
      startX: initX, startY: initY,
      targetX: tx, targetY: ty,
      walkStartedAt: now + idle, // walk starts after initial idle
      segmentSeed: now,          // used to pick next target
    };
    saveNpcState(state);
    return { x: initX, y: initY, idle: true };
  }

  const walkDuration = stepsNeeded(state.startX, state.startY, state.targetX, state.targetY) * WALK_SPEED_MS;
  const walkEnd = state.walkStartedAt + walkDuration;

  // Still in idle before walk starts
  if (now < state.walkStartedAt) {
    return { x: state.startX, y: state.startY, idle: true };
  }

  // Currently walking
  if (now < walkEnd) {
    const elapsed = now - state.walkStartedAt;
    const totalSteps = stepsNeeded(state.startX, state.startY, state.targetX, state.targetY);
    const currentStep = Math.floor(elapsed / WALK_SPEED_MS);
    const pos = posAtStep(state.startX, state.startY, state.targetX, state.targetY, currentStep, totalSteps);
    return { x: pos.x, y: pos.y, idle: false };
  }

  // Walk finished — chain into next segment: idle then walk
  // We might be WAY past walkEnd if the script wasn't called for a while,
  // so we fast-forward through segments until we land in the current one.
  let segSeed = state.segmentSeed;
  let sx = state.targetX;
  let sy = state.targetY;
  let segStart = walkEnd; // start of idle after this walk

  for (let i = 0; i < 100; i++) { // safety cap
    segSeed = hashInt(segSeed + 1);
    const idleDur = pickIdleDuration(segSeed);
    const nextWalkStart = segStart + idleDur;

    const { tx, ty } = pickTarget(segSeed, sx, sy);
    const nextWalkDur = stepsNeeded(sx, sy, tx, ty) * WALK_SPEED_MS;
    const nextWalkEnd = nextWalkStart + nextWalkDur;

    if (now < nextWalkStart) {
      // We're in the idle phase of this segment
      state = { startX: sx, startY: sy, targetX: tx, targetY: ty, walkStartedAt: nextWalkStart, segmentSeed: segSeed };
      saveNpcState(state);
      return { x: sx, y: sy, idle: true };
    }

    if (now < nextWalkEnd) {
      // We're in the walk phase of this segment
      state = { startX: sx, startY: sy, targetX: tx, targetY: ty, walkStartedAt: nextWalkStart, segmentSeed: segSeed };
      saveNpcState(state);
      const elapsed = now - nextWalkStart;
      const totalSteps = stepsNeeded(sx, sy, tx, ty);
      const currentStep = Math.floor(elapsed / WALK_SPEED_MS);
      const pos = posAtStep(sx, sy, tx, ty, currentStep, totalSteps);
      return { x: pos.x, y: pos.y, idle: false };
    }

    // Past this segment entirely, advance
    sx = tx;
    sy = ty;
    segStart = nextWalkEnd;
  }

  // Fallback
  return { x: sx, y: sy, idle: true };
}

// ── Speech bubbles ──────────────────────────────────────────────────
function shouldShowMessage(now) {
  const bucket = Math.floor(now / 5000); // stable for 5s
  return (hashInt(bucket) % 100) < 30;
}

function getMessageIndex(messages, now) {
  const bucket = Math.floor(now / 5000);
  return hashInt(bucket + 31) % messages.length;
}

// ── Render the 3-row track ──────────────────────────────────────────
function renderTrack(buddyX, buddyY, emoji, speech) {
  const rows = [];
  for (let row = 0; row < TRACK_H; row++) {
    let line = '';
    const isBuddyRow = row === buddyY;
    for (let col = 0; col < TRACK_W; col++) {
      if (col === buddyX && isBuddyRow) {
        line += emoji;
      } else if (col === buddyX + 1 && isBuddyRow) {
        continue; // emoji is double-width
      } else {
        line += dim('·');
      }
    }
    if (isBuddyRow && speech) {
      line += '\u00A0' + dim(`"${speech}"`);
    }
    rows.push(line);
  }
  return rows;
}

// ── Read stdin ──────────────────────────────────────────────────────
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
    setTimeout(() => resolve(null), 1000);
  });
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  await readStdin();

  let soul;
  try {
    soul = JSON.parse(fs.readFileSync(SOUL_PATH, 'utf-8'));
  } catch {
    console.log(dim('buddy-evolution: no buddy found'));
    return;
  }

  const { identity, progression, streak } = soul;
  const now = Date.now();

  // Resolve NPC position from wall-clock time
  const npc = resolveNpcPosition(now);

  // XP
  const { inLevel, needed, pct } = getXPProgress(progression.level, progression.totalXP);
  const xpBar = renderXPBar(pct, 10);
  const xpText = dim(`${inLevel}/${needed}`);

  // Speech (only when idle)
  const personality = identity.personality || 'default';
  const messages = VIBE_MESSAGES[personality] || VIBE_MESSAGES.default;
  let speech = null;
  if (npc.idle && shouldShowMessage(now)) {
    speech = messages[getMessageIndex(messages, now)];
  }

  // Render
  const trackRows = renderTrack(npc.x, npc.y, identity.emoji, speech);
  const streakText = streak.currentDays > 0 ? yellow(`\u00A0🔥${streak.currentDays}`) : '';
  const statsLine = [
    bold(identity.name),
    `${dim('Lv')}${cyan(String(progression.level))}`,
    `${xpBar}\u00A0${xpText}`,
  ].join('\u00A0\u00A0') + streakText;

  for (const row of trackRows) {
    console.log(row);
  }
  console.log(statsLine);
}

main().catch(() => process.exit(0));
