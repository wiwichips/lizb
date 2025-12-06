#!/usr/bin/env node

import assert from 'node:assert';

import { lexer } from '../lexer.js';
import { parser } from '../parse.js';
import { evalAst } from '../eval.js';

//const run = (codeStr) => evalAst(parser(lexer(codeStr)));
const run = (codeStr) => {
  const lex = lexer(codeStr);
  console.log(lex);
  return evalAst(parser(lex, {}));
}

// basic behaviour
const when123fn = run(`
(fun (x) (when 
  (= x 1) "A"
  (= x 2) "B"
  (= x 3) "C"
  "DEFAULT"))
`)[0];

assert.equal(when123fn(1), 'A');
assert.equal(when123fn(2), 'B');
assert.equal(when123fn(3), 'C');
assert.equal(when123fn(4), 'DEFAULT');
assert.equal(when123fn(0), 'DEFAULT');

// only default
assert.equal(run('(when 123)'), 123);

// no default, cond matched
assert.equal(run('(when (= 1 1) "A")'), 'A')

// no default, cond not matched, should be undefined
assert.equal(run('(when (= 1 2) "A")'), !!undefined)

