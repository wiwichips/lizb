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

// basics
assert.equal(run('(if (= 1 1) "YES" "NO")'), 'YES')
assert.equal(run('(if 1       "YES" "NO")'), 'YES')
assert.equal(run('(if (= 1 2) "YES" "NO")'), 'NO')
assert.equal(run('(if 0       "YES" "NO")'), 'NO')

// no else case
assert.equal(run('(if (= 1 1) "YES")'), 'YES')
assert.equal(run('(if (= 1 2) "YES")'), !!undefined)

// nested
const iffn = run(`
(fun (a b)
  (if (= a b) "eq"
    (if (> a b) "gt"
      (if (< a b) "lt"))))
`)[0];

assert.equal(iffn(1, 1), 'eq');
assert.equal(iffn(1, 2), 'lt');
assert.equal(iffn(2, 1), 'gt');

