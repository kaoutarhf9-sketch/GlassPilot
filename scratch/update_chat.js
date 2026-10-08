const fs = require('fs');

const files = [
  'app/dashboard/dossiers/[id]/page.js',
  'app/gestionnaire/dossiers/[id]/page.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Find the start of the map
  const mapStr = `messages.map((msg, idx) => {`;
  if (!content.includes(mapStr)) {
    console.log(`Could not find mapStr in ${file}`);
    continue;
  }

  // We want to insert the system message check right after `messages.map((msg, idx) => {`
  const systemMsgUI = `
                if (msg.sender_role === 'system') {
                  return (
                    <div key={idx} className="flex justify-center my-3 w-full">
                      <div className="bg-slate-200/30 border border-slate-300/30 text-slate-500 text-[11px] font-medium px-4 py-1.5 rounded-full flex items-center gap-1.5 max-w-[85%] text-center backdrop-blur-sm">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{msg.message}</span>
                      </div>
                    </div>
                  );
                }`;

  if (!content.includes(`if (msg.sender_role === 'system')`)) {
    content = content.replace(mapStr, `${mapStr}\n${systemMsgUI}`);
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Already updated ${file}`);
  }
}
