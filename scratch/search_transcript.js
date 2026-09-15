const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\K.Hanafi\\.gemini\\antigravity\\brain\\00f77e74-b8ff-4f8d-8cfa-a962661c8d92\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log("Searching transcript lines...");
  let found = 0;
  for (const line of lines) {
    if (line.includes('wiamhanafi21@gmail.com') || line.includes('mdp') || line.includes('password')) {
      // Print first 500 chars of matching line to avoid overflow
      console.log(line.substring(0, 500));
      found++;
      if (found > 30) {
        console.log("Too many matches, stopping.");
        break;
      }
    }
  }
} catch (e) {
  console.error("Error reading transcript:", e);
}
