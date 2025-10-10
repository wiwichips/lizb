/*
 * Big problem... The functions take in a list as args,
 * would it make more sense for them to take in regular
 * positional args? So that it would be more compatible with js?
 * 
 * what does cljs do?
 */

// globals
lizglobal = {
  '*': args => args.reduce((a, c) => a * c, 1),
  '/': args => args.reduce((a, c) => a / c, 1),
  '+': args => args.reduce((a, c) => a + c, 0),
  '-': args => {
    if (args.length === 1)
      return -1 * args[0];
    return args.reduce((a, c) => a - c);
  },
  'cat': args => args.join(''),
  'print': console.log,
  'console.log': args => console.log(...args),
  'Math.max': args => Math.max(...args),
};
for (const key in lizglobal) { lizglobal[key].liz = true; }

exports.lizglobal = lizglobal;

