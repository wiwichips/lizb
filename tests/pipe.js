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

assert.equal(liz`
(pipe "hello world"
  rest
  (js/eval "x=>x.toUpperCase()")
  (fun (x) (split x " "))
  first)
`, "ELLO");

