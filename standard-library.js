// host env modules
const js = globalThis;
const nodejs = {
  // todo
}

// standard library 
const standardLibrary = {
  // modules
  'js': js,
  'nodejs': nodejs,

  // standard library
  '*': (...args) => args.reduce((a, c) => a * c, 1),
  '/': (...args) => args.reduce((a, c) => a / c, 1),
  '+': (...args) => args.reduce((a, c) => a + c, 0),
  '-': (...args) => {
    if (args.length === 1)
      return -1 * args[0];
    return args.reduce((a, c) => a - c);
  },
  'cat': args => args.join(''),
  'print': console.log,
//  'map': (fn, list) => 
};
//for (const key in lizglobal) { lizglobal[key].liz = true; }

exports.std = standardLibrary;

