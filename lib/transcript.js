'use strict';

const fs = require('fs');
const readline = require('readline');
const { TEST_PATTERNS } = require('./constants');

/**
 * Parse a Claude Code transcript JSONL file and extract session metrics.
 *
 * Real transcript format (as of Claude Code v2.1+):
 *   { type: "assistant", message: { role: "assistant", content: [ { type: "tool_use", name: "Bash", input: {...} }, ... ] }, timestamp: "..." }
 *   { type: "user",      message: { role: "user",      content: [ { type: "tool_result", tool_use_id: "...", content: "..." }, ... ] }, timestamp: "..." }
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

  const pendingToolCalls = new Set(); // track tool_use_ids to match with results

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    // Track timestamps
    const ts = entry.timestamp || entry.createdAt;
    if (ts) {
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        if (!metrics.startTime || date < metrics.startTime) metrics.startTime = date;
        if (!metrics.endTime || date > metrics.endTime) metrics.endTime = date;
      }
    }

    // Track project directory from cwd field
    if (entry.cwd && !metrics.projectDir) {
      metrics.projectDir = entry.cwd;
    }

    // Get message content blocks
    const message = entry.message || {};
    const content = Array.isArray(message.content) ? message.content : [];

    for (const block of content) {
      if (!block || typeof block !== 'object') continue;

      // === Tool Use (from assistant messages) ===
      if (block.type === 'tool_use') {
        const toolName = block.name || '';
        const toolInput = block.input || {};

        metrics.toolCalls++;

        if (block.id) {
          pendingToolCalls.add(block.id);
        }

        if (toolName === 'Bash') {
          metrics.bashCalls++;
          const cmd = toolInput.command || '';
          if (isTestCommand(cmd)) {
            metrics.testRuns++;
          }
        } else if (toolName === 'Write' || toolName === 'Edit') {
          metrics.fileEdits++;
          const filePath = toolInput.file_path;
          if (filePath) metrics.filesEdited.add(filePath);
        } else if (toolName === 'Read') {
          metrics.readCalls++;
        } else if (toolName === 'Grep' || toolName === 'Glob') {
          metrics.grepCalls++;
        }
      }

      // === Tool Result (from user messages — contains tool output) ===
      if (block.type === 'tool_result') {
        const toolUseId = block.tool_use_id;
        if (toolUseId) {
          pendingToolCalls.delete(toolUseId);
        }
        // Check for errors (avoid double-counting)
        let isRejected = block.is_error === true;
        if (!isRejected) {
          const resultContent = typeof block.content === 'string' ? block.content : '';
          isRejected = resultContent.includes('The user doesn\'t want to proceed') ||
                       resultContent.includes('was rejected');
        }
        if (isRejected) {
          metrics.rejectedToolCalls++;
        }
      }

      // === Text blocks from assistant (estimate output tokens) ===
      if (block.type === 'text' && message.role === 'assistant') {
        metrics.estimatedOutputChars += (block.text || '').length;
      }
    }

    // Also handle string content from assistant (plain text responses)
    if (typeof message.content === 'string' && message.role === 'assistant') {
      metrics.estimatedOutputChars += message.content.length;
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

function isTestCommand(cmd) {
  return TEST_PATTERNS.some(pattern => pattern.test(cmd));
}

module.exports = { parseTranscript };
