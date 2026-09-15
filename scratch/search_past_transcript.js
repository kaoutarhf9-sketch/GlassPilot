const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\K.Hanafi\\.gemini\\antigravity\\brain\\a6bb340a-d15d-4309-b99d-d5e3421a8d28\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log("Searching past conversation transcript...");
  lines.forEach((line, index) => {
    if (line.includes('admin') || line.includes('mdp') || line.includes('password') || line.includes('@')) {
      const match = line.match(/"content":"([^"]+)"/);
      if (match) {
        const text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        if (text.includes('mail') || text.includes('mdp') || text.includes('password') || text.includes('admin')) {
          console.log(`[Line ${index}]`, text.substring(0, 300).replace(/\n/g, ' '));
        }
      }
    }
  });
} catch (e) {
  console.error("Error reading past transcript:", e);
}
