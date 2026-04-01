'use strict';

const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.buddy-evolution');
const SOUL_PATH = path.join(DATA_DIR, 'soul.json');
const JOURNAL_DIR = path.join(DATA_DIR, 'journal');

const SPECIES = [
  { id: 'duck',      emoji: '🦆', rarity: 'common' },
  { id: 'goose',     emoji: '🪿', rarity: 'common' },
  { id: 'blob',      emoji: '🫠', rarity: 'common' },
  { id: 'snail',     emoji: '🐌', rarity: 'common' },
  { id: 'cat',       emoji: '🐱', rarity: 'uncommon' },
  { id: 'rabbit',    emoji: '🐰', rarity: 'uncommon' },
  { id: 'owl',       emoji: '🦉', rarity: 'uncommon' },
  { id: 'penguin',   emoji: '🐧', rarity: 'uncommon' },
  { id: 'turtle',    emoji: '🐢', rarity: 'rare' },
  { id: 'octopus',   emoji: '🐙', rarity: 'rare' },
  { id: 'axolotl',   emoji: '🦎', rarity: 'rare' },
  { id: 'ghost',     emoji: '👻', rarity: 'epic' },
  { id: 'robot',     emoji: '🤖', rarity: 'epic' },
  { id: 'dragon',    emoji: '🐉', rarity: 'epic' },
  { id: 'capybara',  emoji: '🦫', rarity: 'legendary' },
  { id: 'mushroom',  emoji: '🍄', rarity: 'legendary' },
  { id: 'cactus',    emoji: '🌵', rarity: 'legendary' },
  { id: 'chonk',     emoji: '🐻', rarity: 'legendary' },
];

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const NAMES = {
  duck:     ['Quackers', 'Waddle', 'Drake', 'Mallard', 'Puddle', 'Biscuit'],
  goose:    ['Honk', 'Gander', 'Maverick', 'Noodle', 'Chaos', 'Goosifer'],
  blob:     ['Blobby', 'Gloop', 'Squish', 'Morph', 'Jello', 'Pudge'],
  snail:    ['Turbo', 'Shell', 'Spiral', 'Glide', 'Sluggo', 'Trail'],
  cat:      ['Whiskers', 'Shadow', 'Pixel', 'Byte', 'Nyx', 'Mochi'],
  rabbit:   ['Hoppy', 'Clover', 'Binky', 'Dash', 'Pepper', 'Bun'],
  owl:      ['Hoot', 'Sage', 'Athena', 'Pebble', 'Cosmo', 'Archie'],
  penguin:  ['Waddles', 'Tux', 'Frost', 'Pebble', 'Flip', 'Ice'],
  turtle:   ['Quibble', 'Shelly', 'Tank', 'Mossy', 'Newton', 'Zen'],
  octopus:  ['Cinder', 'Inky', 'Coral', 'Tentacle', 'Marina', 'Squid'],
  axolotl:  ['Axel', 'Gilly', 'Lotus', 'Bubbles', 'Sprout', 'Nemo'],
  ghost:    ['Phantom', 'Specter', 'Boo', 'Wisp', 'Shade', 'Echo'],
  robot:    ['Bolt', 'Circuit', 'Spark', 'Chrome', 'Bit', 'Nano'],
  dragon:   ['Zephyr', 'Ember', 'Fang', 'Blaze', 'Storm', 'Ash'],
  capybara: ['Cappy', 'Zen', 'Lola', 'Bongo', 'Mango', 'Chill'],
  mushroom: ['Spore', 'Truffle', 'Cap', 'Shiitake', 'Morel', 'Fungi'],
  cactus:   ['Spike', 'Prickle', 'Oasis', 'Bloom', 'Sandy', 'Thorn'],
  chonk:    ['Chungus', 'Bumble', 'Chunk', 'Tank', 'Fluff', 'Thicc'],
};

const STAT_NAMES = ['debugging', 'patience', 'chaos', 'wisdom', 'snark'];

// XP required to reach each level (cumulative)
const LEVEL_THRESHOLDS = [
  0,       // Level 1
  1000,    // Level 2
  3000,    // Level 3
  6000,    // Level 4
  10000,   // Level 5  — first evolution choice
  16000,   // Level 6
  24000,   // Level 7
  35000,   // Level 8
  50000,   // Level 9
  70000,   // Level 10 — second evolution choice
  95000,   // Level 11
  125000,  // Level 12
  160000,  // Level 13
  200000,  // Level 14
  250000,  // Level 15 — shiny variant
  310000,  // Level 16
  380000,  // Level 17
  460000,  // Level 18
  550000,  // Level 19
  650000,  // Level 20 — legendary cosmetics
];

const TIER_LEVELS = {
  hatchling: 1,
  juvenile:  5,
  adult:     10,
  elder:     15,
  ascended:  20,
};

// Regex patterns to detect test commands in Bash tool calls
const TEST_PATTERNS = [
  /\b(jest|vitest|mocha|ava|tap)\b/i,
  /\bnpm\s+(run\s+)?test/i,
  /\bpnpm\s+(run\s+)?test/i,
  /\byarn\s+(run\s+)?test/i,
  /\bnpx\s+(jest|vitest|mocha|playwright|cypress)/i,
  /\bpytest\b/i,
  /\bpython\s+-m\s+(pytest|unittest)/i,
  /\bgo\s+test\b/i,
  /\bcargo\s+test\b/i,
  /\bmake\s+test\b/i,
  /\brspec\b/i,
  /\bbundle\s+exec\s+rspec/i,
  /\bphpunit\b/i,
  /\bdotnet\s+test\b/i,
  /\bgradle\s+test\b/i,
  /\bmvn\s+test\b/i,
];

// XP rewards per action (balanced for ~14 sessions to level 5)
const XP_PER_TOOL_CALL = 5;
const XP_PER_FILE_EDIT = 15;
const XP_PER_TEST_RUN = 30;
const XP_PER_10_MINUTES = 20;
const XP_DURATION_CAP = 300;
const XP_SESSION_FLAT = 200;

const STREAK_MULTIPLIER_INCREMENT = 0.1;
const STREAK_MULTIPLIER_CAP = 2.0;

module.exports = {
  DATA_DIR,
  SOUL_PATH,
  JOURNAL_DIR,
  SPECIES,
  RARITY_ORDER,
  NAMES,
  STAT_NAMES,
  LEVEL_THRESHOLDS,
  TIER_LEVELS,
  TEST_PATTERNS,
  XP_PER_TOOL_CALL,
  XP_PER_FILE_EDIT,
  XP_PER_TEST_RUN,
  XP_PER_10_MINUTES,
  XP_DURATION_CAP,
  XP_SESSION_FLAT,
  STREAK_MULTIPLIER_INCREMENT,
  STREAK_MULTIPLIER_CAP,
};
