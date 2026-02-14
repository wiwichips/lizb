#!/usr/bin/env node

import assert from 'node:assert';

import { lexer } from '../lexer.js';
import { parser } from '../parse.js';
import { evalAst, evalProgram } from '../eval.js';

const parseCode = (codeStr) => parser(lexer(codeStr));

// root program behaves the same as evalAst
{
  const ast = parseCode(`(+ 1 2) (+ 3 4)`);
  assert.deepEqual(evalProgram(ast), evalAst(ast));
  assert.deepEqual(evalProgram(ast), [3, 7]);
}

// single expression (non-root) is always wrapped in a list
{
  const ast = parseCode(`(+ 1 2)`);
  assert.deepEqual(evalProgram(ast[1]), [3]);
}

// function expression remains as a single element list
{
  const ast = parseCode(`(f + 1 2)`);
  const result = evalProgram(ast[1]);
  assert.equal(result.length, 1);
  assert.equal(result[0](), 3);
}

// nested call evaluates to value but still wrapped
{
  const ast = parseCode(`((f + 1 2))`);
  assert.deepEqual(evalProgram(ast[1]), [3]);
}
