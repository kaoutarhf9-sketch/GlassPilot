const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\K.Hanafi\\.gemini\\antigravity\\brain\\00f77e74-b8ff-4f8d-8cfa-a962661c8d92\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log("Searching transcript for passwords and emails...");
  lines.forEach((line, index) => {
    // Look for lines containing email pattern or words like password/mot de passe
    if (line.includes('@') || line.includes('pass') || line.includes('mdp') || line.includes('Admin') || line.includes('identifiant')) {
      const match = line.match(/"content":"([^"]+)"/);
      if (match) {
        const text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        if (text.includes('wiam') || text.includes('kaoutar') || text.includes('mdp') || text.includes('password') || text.includes('admin')) {
          console.log(`[Line ${index}]`, text.substring(0, 300).replace(/\n/g, ' '));
        }
      }
    }
  });
} catch (e) {
  console.error("Error:", e);
}
