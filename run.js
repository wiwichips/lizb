#!/usr/bin/env node
import { lexer } from './lexer.js';
import { parser } from './parse.js';
import { evalAst } from './eval.js';
import fs from 'node:fs';
import readline from 'node:readline';

let code = `
(print
  "Welcome to" (last (split \"${process.argv[1]}\" "/")))
`;

let verbosity = 0;

async function main() {
  let mode = undefined;

  for (const opt of process.argv.slice(2)) {
    if (mode === 'eval') {
      code = opt;
      mode = undefined;
    }

    else if (['-e', '--eval'].includes(opt))
      mode = 'eval';
    else if (['-r', '--repl'].includes(opt))
      await readEvalPrintLoop();
    else if (['-v', '--verbose'].includes(opt))
      verbosity += 1;
    else if (['-vv'].includes(opt))
      verbosity += 2;
    else {
      code = fs.readFileSync(opt, 'utf8');
      await runCode(code);
    }
  }
}

async function readEvalPrintLoop() {
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
    if (line === 'q')
      process.exit(0);

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
  verbosity >= 2 && console.log(tokens);

  const ast = parser(tokens);
  verbosity >= 1 && console.log(ast);

  const ret = evalAst(ast);
  console.log(ret);
}

main();

