#!/usr/bin/env node

import assert from 'node:assert';

import { lexer } from '../lexer.js';
import { parser } from '../parse.js';
import { evalAst } from '../eval.js';

const run = (codeStr) => evalAst(parser(lexer(codeStr)));
const liz = (strings, ...values) => {
  const codeStr = strings
    .map((str, i) => str + (i < values.length ? values[i] : ""))
    .join("");

  return evalAst(parser(lexer(codeStr)));
};

// single variable shortcut syntax
assert.equal(liz`(let x 1 (+ x x))`, 2);

// multiple variables syntax
assert.equal(liz`(let (a 1) (+ a a))`, 2);
assert.equal(liz`(let (a 100 b 10 c 1) (+ a b c))`, 111);

// definitions available in next definition?
assert.equal(liz`
(let
  (a 7
   b (+ a a)
   c (* a b))
  c)
`, 7 * (7 + 7));

// multiple code
assert.equal(liz`(let x 1 1 2 3 4 5 6 7 8 9 10)`, 10);
assert.equal(liz`(let (x 1) 1 2 3 4 5 6 7 8 9 10)`, 10);
assert.equal(liz`
(let x 1
  (global y 2)
  (+ x y))
`, 3);

