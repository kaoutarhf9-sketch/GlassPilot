const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\K.Hanafi\\.gemini\\antigravity\\brain\\00f77e74-b8ff-4f8d-8cfa-a962661c8d92\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log("Searching transcript for admin login details...");
  let found = [];
  for (const line of lines) {
    if (line.includes('kaoutarhf9@gmail.com') || line.includes('Admin2026') || line.includes('admin') || line.includes('mdp')) {
      // Find clean text snippets
      const match = line.match(/"content":"([^"]+)"/);
      if (match) {
        const text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        if (text.includes('mail') || text.includes('mdp') || text.includes('password') || text.includes('Admin') || text.includes('connect')) {
          found.push(text);
        }
      }
    }
  }
  
  // Print unique messages found
  const unique = [...new Set(found)];
  console.log(`Found ${unique.length} unique references:`);
  unique.forEach((u, i) => {
    console.log(`--- MATCH ${i+1} ---`);
    console.log(u.substring(0, 1000));
  });
} catch (e) {
  console.error("Error reading transcript:", e);
}
