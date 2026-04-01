'use strict';

const { execFileSync } = require('child_process');

function sendNotification(title, body) {
  try {
    const platform = process.platform;
    if (platform === 'linux') {
      execFileSync('notify-send', [String(title), String(body), '--icon=dialog-information'], { timeout: 3000, stdio: 'ignore' });
    } else if (platform === 'darwin') {
      execFileSync('osascript', ['-e', `display notification "${String(body)}" with title "${String(title)}"`], { timeout: 3000, stdio: 'ignore' });
    }
  } catch {
    // Silent failure — notifications are optional
  }
}

module.exports = { sendNotification };
