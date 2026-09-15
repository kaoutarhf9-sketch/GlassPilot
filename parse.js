const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Extract style
const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/i);
const styleContent = styleMatch ? styleMatch[1] : '';

// Extract script
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/i);
const scriptContent = scriptMatch ? scriptMatch[1] : '';

// Extract body (everything inside <body> ... </body>)
const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<script>/i) || content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
let bodyContent = bodyMatch ? bodyMatch[1] : '';

// Remove <body> and </body> if they accidentally got caught
bodyContent = bodyContent.replace(/<\/?body[^>]*>/gi, '');

// Replace class with className
bodyContent = bodyContent.replace(/class=/g, 'className=');
bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
bodyContent = bodyContent.replace(/tabindex=/g, 'tabIndex=');
bodyContent = bodyContent.replace(/onclick=/g, 'onClick=');

// Fix unclosed tags (img, input, br, hr)
bodyContent = bodyContent.replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1 />');
bodyContent = bodyContent.replace(/<input([^>]*?)(?<!\/)>/gi, '<input$1 />');
bodyContent = bodyContent.replace(/<br([^>]*?)(?<!\/)>/gi, '<br$1 />');
bodyContent = bodyContent.replace(/<hr([^>]*?)(?<!\/)>/gi, '<hr$1 />');

// Remove any inline style objects that might be invalid (convert string to object)
// e.g. style="font-size:.83rem;padding:.72rem 1.6rem;display:inline-flex"
bodyContent = bodyContent.replace(/style="([^"]+)"/g, (match, styles) => {
  const parts = styles.split(';').filter(Boolean);
  let objStr = parts.map(p => {
    let [k, v] = p.split(':');
    if (!k || !v) return '';
    k = k.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    v = v.trim();
    return `${k}: '${v}'`;
  }).filter(Boolean).join(', ');
  return `style={{${objStr}}}`;
});

// HTML comments to JSX comments
bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// Create Next.js React component
const finalCode = `'use client';
import React, { useEffect } from 'react';
import Head from 'next/head';

export default function Page() {
  useEffect(() => {
    ${scriptContent.replace(/\$/g, '\\$')}
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: \`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        ${styleContent.replace(/`/g, '\\`')}
      \`}} />
      ${bodyContent}
    </>
  );
}
`;

fs.writeFileSync('app/page.tsx', finalCode);
console.log('Done!');
