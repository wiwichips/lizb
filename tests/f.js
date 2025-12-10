#!/usr/bin/env node

import assert from 'node:assert';

import { lexer } from '../lexer.js';
import { parser } from '../parse.js';
import { evalAst } from '../eval.js';

//const run = (codeStr) => evalAst(parser(lexer(codeStr)));
const run = (codeStr) => {
  const lex = lexer(codeStr);
  return evalAst(parser(lex, {}));
}

// no args
assert.equal(run(`(f + 1 2)`)[0](), 3);
assert.equal(run(`((f + 1 2))`), 3);

// args
assert.equal(run(`(f.a * a a)`)[0](3), 9);
assert.equal(run(`(f.a.b * a b)`)[0](3, 7), 21);

// nested
assert.equal(run(`(f.a.b - ((f.x * x x) a) ((f.x + x x) b))`)[0](3, 7), -5);

// nested using closure of outer funciton
assert.equal(run(`(f.a.b (f * a b))`)[0](3, 7), 21);

// test passing to js
assert.equal(run('((js/eval "fn=>fn(7)") (f.x * x x))'), 49);

