'use strict';

const fs = require('fs');
const readline = require('readline');
const { TEST_PATTERNS } = require('./constants');

/**
 * Parse a Claude Code transcript JSONL file and extract session metrics.
 * Reads line-by-line for memory efficiency with large transcripts.
 */
async function parseTranscript(transcriptPath) {
  const metrics = {
    toolCalls: 0,
    rejectedToolCalls: 0,
    fileEdits: 0,
    filesEdited: new Set(),
    testRuns: 0,
    bashCalls: 0,
    readCalls: 0,
    grepCalls: 0,
    startTime: null,
    endTime: null,
    durationMinutes: 0,
    projectDir: '',
    estimatedOutputChars: 0,
  };

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return metrics;
  }

  const stream = fs.createReadStream(transcriptPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lastToolCallSucceeded = true;

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    // Track timestamps from any entry that has one
    const ts = entry.timestamp || entry.createdAt || entry.created_at;
    if (ts) {
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        if (!metrics.startTime || date < metrics.startTime) metrics.startTime = date;
        if (!metrics.endTime || date > metrics.endTime) metrics.endTime = date;
      }
    }

    // Detect tool use entries
    if (isToolUse(entry)) {
      const toolName = extractToolName(entry);
      const toolInput = extractToolInput(entry);

      metrics.toolCalls++;

      if (toolName === 'Bash' || toolName === 'bash') {
        metrics.bashCalls++;
        const cmd = toolInput?.command || '';
        if (isTestCommand(cmd)) {
          metrics.testRuns++;
        }
      } else if (toolName === 'Write' || toolName === 'Edit') {
        metrics.fileEdits++;
        const filePath = toolInput?.file_path;
        if (filePath) metrics.filesEdited.add(filePath);
      } else if (toolName === 'Read') {
        metrics.readCalls++;
      } else if (toolName === 'Grep' || toolName === 'Glob') {
        metrics.grepCalls++;
      }

      lastToolCallSucceeded = true;
    }

    // Detect tool errors / rejections
    if (isToolError(entry)) {
      if (lastToolCallSucceeded) {
        metrics.rejectedToolCalls++;
        lastToolCallSucceeded = false;
      }
    }

    // Estimate output tokens from assistant messages
    if (isAssistantMessage(entry)) {
      const text = extractAssistantText(entry);
      if (text) metrics.estimatedOutputChars += text.length;
    }
  }

  // Calculate duration
  if (metrics.startTime && metrics.endTime) {
    metrics.durationMinutes = Math.round(
      (metrics.endTime - metrics.startTime) / 60000
    );
  }

  // Convert Set to count for serialization
  metrics.uniqueFilesEdited = metrics.filesEdited.size;
  metrics.filesEditedList = [...metrics.filesEdited];
  delete metrics.filesEdited;

  return metrics;
}

// --- Detection helpers (resilient to different transcript formats) ---

function isToolUse(entry) {
  if (entry.type === 'tool_use') return true;
  if (entry.type === 'assistant' && entry.content) {
    if (Array.isArray(entry.content)) {
      return entry.content.some(c => c.type === 'tool_use');
    }
  }
  if (entry.tool_name || entry.toolName) return true;
  return false;
}

function extractToolName(entry) {
  if (entry.tool_name) return entry.tool_name;
  if (entry.toolName) return entry.toolName;
  if (entry.name) return entry.name;
  if (Array.isArray(entry.content)) {
    const toolBlock = entry.content.find(c => c.type === 'tool_use');
    if (toolBlock) return toolBlock.name;
  }
  return '';
}

function extractToolInput(entry) {
  if (entry.tool_input) return entry.tool_input;
  if (entry.toolInput) return entry.toolInput;
  if (entry.input) return entry.input;
  if (Array.isArray(entry.content)) {
    const toolBlock = entry.content.find(c => c.type === 'tool_use');
    if (toolBlock) return toolBlock.input;
  }
  return {};
}

function isToolError(entry) {
  if (entry.type === 'tool_result' && entry.is_error) return true;
  if (entry.type === 'error') return true;
  if (entry.error) return true;
  return false;
}

function isAssistantMessage(entry) {
  return entry.role === 'assistant' || entry.type === 'assistant';
}

function extractAssistantText(entry) {
  if (typeof entry.content === 'string') return entry.content;
  if (Array.isArray(entry.content)) {
    return entry.content
      .filter(c => c.type === 'text')
      .map(c => c.text || '')
      .join('');
  }
  return '';
}

function isTestCommand(cmd) {
  return TEST_PATTERNS.some(pattern => pattern.test(cmd));
}

module.exports = { parseTranscript };
