#!/usr/bin/env node
import { lexer } from './lexer.js';
import { parser } from './parse.js';
import { evalAst } from './eval.js';
import fs from 'node:fs';
import readline from 'node:readline';

let code = `
(print "Welcome to" (last (split \"${process.argv[1]}\" "/")))
`;

async function main() {
  if (process.argv.length > 2) {
    const uargs = process.argv.slice(2);
    if (uargs[0] === '-e' || uargs[0] === '--eval')
      code = uargs[1];

    else if (uargs[0] === '-r' || uargs[0] === '--repl') {
      readEvalPrintLoop();
    } else
      code = fs.readFileSync(uargs[0], 'utf8');
  }
  runCode(code);
}

async function readEvalPrintLoop(options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    historySize: 100,
    removeHistoryDuplicates: true,
  });

  rl.setPrompt("> ");

  await rl;

  rl.prompt(true);

  for await (const line of rl) {
    // optional: ignore empty lines
    if (line.trim() === "") {
      rl.prompt(true);
      continue;
    }

    await runCode(line);
    rl.prompt(true);
  }
}

function runCode(codeString) {
  const tokens = lexer(codeString);
  //console.log(tokens);

  const ast = parser(tokens);
  //console.log(ast);

  const ret = evalAst(ast);
  console.log(ret);
}

main();

