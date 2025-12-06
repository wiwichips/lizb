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

assert.equal(liz`(+ 1 2 3 4 5)`, 1 + 2 + 3 + 4 + 5)
assert.equal(liz`(+ (- (* 3 7) 13) -254)`, -246)

const results = liz`
(if (= 7 7) "yes" "no")
(if (= 1 2) "yes" "no")
(if (= 7 7) "onlyyes")
(if (= 1 2) "onlyyes")
`;

assert.equal(results[0], "yes");
assert.equal(results[1], "no");
assert.equal(results[2], "onlyyes");
assert.equal(!!results[3], !!undefined); // should be nullable


