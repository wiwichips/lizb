import { lexer } from './lexer.js';
import { parser } from './parse.js';
import { evaluate } from './eval.js';

export function runLizb(code) {
  const tokens = lexer(code);
  const ast = parser(tokens);
  return evaluate(ast);
}

export async function runLizbScripts() {
  const scripts = Array.from(document.querySelectorAll('script[type="text/lizb"]'));
  for (const s of scripts) {
    const code = s.src
      ? await (await fetch(s.src)).text()   // same-origin or CORS-enabled
      : (s.textContent ?? '');
    try {
      runLizb(code);
    } catch (err) {
      console.error('Lizb script error:', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runLizbScripts, { once: true });
} else {
  runLizbScripts();
}

