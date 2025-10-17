import { Context } from './context.js';
import { evaluate } from './eval.js';

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
  'cat': (...args) => args.join(''),
  'print': console.log,
  'list': (...args) => args,

  /**
   * (map fn list) OR (map fn list1 list2 ... listN)
   *                        ^- fn operates on N args
   */
  'map': function map_impl() {
    const fn = arguments[0];
    // (map fn data)
    if (arguments.length === 2)
      return arguments[1].map(x=>fn(x));

    // (map fn list1 list2 list3)
    const rest = Array.from(arguments).splice(1);
    const minLength = Math.min(...rest.map(x=>x.length));

    let result = [];
    for (let i = 0; i < minLength; i++) {
      const row = [];
      for (const lst of rest)
        row.push(lst[i]);
      result.push(fn(...lst));
    }
    return result;
  }
};

// functions for processing code for lambdas etc
class Special {
  constructor(proc) {
    this.proc = proc;
    this.ctx = new Context();
  }

  // returns value
  process(ast, ctx) {
    return this.proc(ast, ctx);
  }
}



const specialHandlers = {
  /**
   * Define a function in the following forms:
   * 
   * examples:
   * - (defun name (p1 p2 p3) (code)) - keyword token list list
   * - (defun name params (code))     - keyword token token list
   * - (defun name (code))            - keyword token list
   * - (fun (p1 p2 p3) (code)) - keyword list list
   * - (fun params (code))     - keyword token list
   * - (fun (code))            - keyword list
   */
  'fun': new Special((ast, ctx) => {
    const code = ast.pop(); // code always last

    // process function parameter names
    let args = [];
    if (ast.length > 0) {
      const argObj = ast.pop();
      if (argObj instanceof Array)
        args.push(...argObj);
      else
        args  = argObj;
    }

    // create a function which returns a function to execute based on the args passed
    function wrapper() {
      // define scope
      const scope = {};
      if (args instanceof Array)
        for (let i = 0; i < arguments.length; i++)
          scope[args[i].token] = arguments[i];
      else
        scope[args.token] = Array.from(arguments);
      const innerCtx = new Context(scope, ctx);

      // execute function with new scope
      return evaluate(code, innerCtx);
    }

    return wrapper;
  }),

  /**
   * Define a variable in the following forms:
   * examples:
   * - NOT SUPPORTED --> (let x val (code)) <-- should I do this later?
   * - (let (a v1) (b v2) (c v3) (code))
   */
  'let': new Special((ast, ctx) => {
    const rest = ast.splice(1);
    const code = rest.pop();

    // account for shotcut case where no brackets around single key value thing
    if (rest.length === 2 && !(rest[0] instanceof Array)) {
      rest[0] = [rest[0], rest[1]];
      rest.pop()
    }

    const scope = {};
    for (const vp of rest)
      scope[vp[0].token] = evaluate(vp[1], ctx);
    const innerCtx = new Context(scope, ctx);

    return evaluate(code, innerCtx);
  }),
};

export const std = standardLibrary;
export const specials = specialHandlers;
export { Special };

