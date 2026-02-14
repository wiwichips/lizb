#!/usr/bin/env node

import assert from 'node:assert';

import { lexer } from '../lexer.js';
import { parser } from '../parse.js';
import { evalAst } from '../eval.js';

const run = (codeStr) => evalAst(parser(lexer(codeStr)));

// single-line dot list
assert.equal(run(`.+ 1 2 3 4`), 10);

// multi-line dot list with same indent
assert.equal(
  run(`.+ 1 2\n  3\n  4\n`),
  10
);

// nested dot lists with indents
assert.equal(
  run(`.+\n  .*\n    2\n    7\n  100\n`),
  114
);

// dot list followed by another top-level expression
const results = run(`.list\n  1\n  2\n.+ 3 4\n`);
assert.deepEqual(results, [[1, 2], 7]);

// dot syntax for a side-effecting call (should not throw)
assert.doesNotThrow(() => run(`.print "Hello, World!"`));

// bigger examples and edge cases (using multi-line strings)
assert.equal(
  run(`.+\n  1\n  2\n  3\n  4\n  5\n  6\n  7\n  8\n  9\n  10\n`),
  55
);

assert.equal(
  run(`.list\n  "a"\n  "b"\n  "c"\n  "d"\n`)[0].length,
  4
);

assert.equal(
  run(`.+\n  .*\n    2\n    .+\n      3\n      4\n  5\n`),
  19
);

assert.deepEqual(
  run(`.list\n  .list\n    1\n    2\n  .list\n    3\n    4\n`)[0],
  [[1, 2], [3, 4]]
);

assert.equal(
  run(`.pipe\n  "hello"\n  (js/eval "x=>x.toUpperCase()")\n  (js/eval "x=>x + '!'")\n`),
  "HELLO!"
);

assert.equal(
  run(`.when\n  (= 1 1)\n  "yes"\n  (= 1 2)\n  "no"\n`),
  "yes"
);

assert.equal(
  run(`.if\n  (= 1 2)\n  "no"\n  "yes"\n`),
  "yes"
);

assert.deepEqual(
  run(`.list\n  .+\n    1\n    2\n  .+\n    3\n    4\n  .+\n    5\n    6\n`)[0],
  [3, 7, 11]
);

assert.equal(
  run(`.\n  .fun () .* 7 7\n`),
  49
);

// comments interspliced with different nesting
const exampleCode =`
# 150 + 7 = 157
.+
  # 50 * 3 = 150
  .*

    # 50
    .-
      100
      50

    # 3
    (+ 1 1 1)

  7
`;
assert.deepEqual(
  run(exampleCode)[0],
  157
);

// ending without newline
assert.equal(
  run(`.+ 1 2 3`),
  6
);

// ending without newline after newline+indent
assert.equal(
  run(`.+ 1 2\n  3`),
  6
);

// another case of ending without newline after newline+indent
assert.equal(
  run(`.\n  .fun () .* 7 7`),
  49
);

// bigger example of ending without newline
const exampleCode02 =`
# 150
.+
  # 50 * 3 = 150
  .*

    # 50
    .-
      100
      50

    # 3
    (+ 1 1 1)`;
assert.deepEqual(
  run(exampleCode02)[0],
  150
);

