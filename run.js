#!/usr/bin/env node
import { lexer } from './lexer.js';
import { parser } from './parse.js';
import { evalAst } from './eval.js';
import fs from 'node:fs';
import readline from 'node:readline';


//todo this is evil, undo this later...
Object.defineProperty(Array.prototype, "splice", {
  value: function (start, deleteCount) {
    const arr = this;
    let len = arr.length;

    // Handle negative start like Array.prototype.splice
    if (start < 0) {
      start = Math.max(len + start, 0);
    } else {
      start = Math.min(start, len);
    }

    // Handle deleteCount like splice
    if (deleteCount === undefined) {
      deleteCount = len - start;
    } else {
      deleteCount = Math.max(0, Math.min(deleteCount, len - start));
    }

    // Just return what splice *would* remove, without mutating
    return arr.slice(start, start + deleteCount);
  },
  writable: true,
  configurable: true,
  enumerable: false, // so it behaves like built-ins in for...in
});


let code = `
# simple math
(js/console.log (* (+ 2) (+ 1 7)))

# js interop
(js/console.log "hello world") #after comment

(js/Math.max 100 123 77)
`;

async function main() {
  if (process.argv.length > 2) {
    const uargs = process.argv.slice(2);
    if (uargs[0] === '-e' || uargs[0] === '--eval')
      code = uargs[1];
    else if (uargs[0] === '-r' || uargs[0] === '--repl') {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });
      rl.setPrompt("> ");
      rl.prompt();

      for await (const line of rl) {
        runCode(line);
        rl.prompt();
      }
    } else
      code = fs.readFileSync(uargs[0], 'utf8');
  }
  runCode(code);
}

function runCode(codeString) {
  const tokens = lexer(codeString);
  console.log(tokens);

  const ast = parser(tokens);
  console.log(ast);

  const ret = evalAst(ast);
  console.log(ret);
}

main();

