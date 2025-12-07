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
assert.equal(run(`((fun 123))`), 123);
assert.equal(run(`(fun 123)`)[0](), 123);

// (fun (p1 p2 p3) expr)
assert.equal(run(`(fun (a) a)`)[0](77), 77);
assert.equal(run(`(fun (a b c) (+ a b c))`)[0](1, 10, 100), 111);

// (fun variadic-list expr)
assert.equal(run(`(fun lst (reduce + 0 lst))`)[0](5, 7, 11), 23);

// recursion
assert.equal(run(`
(global fac (fun (n)
  (if (< n 1)
    1
    (* n (fac (- n 1))))))
(fac 20)
`)[1], 2432902008176640000);

// parameter deconstruction
assert.equal(run(`((fun ((a)) a) (list 77))`), 77);
assert.equal(run(`((fun ((a b)) (+ a b)) (list 77 11))`), 88);

