import { Context } from './context.js';
import { evaluate } from './eval.js';

import { readFileSync } from "node:fs"; // won't work in browser... TODO

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
  '=': (...args) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i - 1] !== args[i]) return false;
    }
    return true;
  },
  'mod': (dividend, divisor) => dividend % divisor,
  'not': x => !x,
  'div': (dividend, divisor) => !(dividend % divisor),
  'and': (...args) => args.reduce((a, c) => a && c, true),

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
  },

  /**
   * (where fn list)
   * TODO: UnTEstED
   */
  'where': function filter_impl() {
    const fn = arguments[0];
    const lst = arguments[1];

    return lst.filter(fn);
  },

  /**
   * remove duplicates
   * (unique lst)
   */
  'unique': function unique_impl() {
    const lst = arguments[0];

    const resSet = new Set(lst);
    return Array.from(resSet);
  },

  'fs': {
    read: (fname) => readFileSync(fname, 'utf8'),
  },

  'split': (s,d) => s.split(d),
  'len': x => x.length,

  'first': x => x[0],

  /**
   * (range num) --> 0, ... num
   */
  'range': function() {
    const n = arguments[0] - 1;
    return Array.from({ length: n }, (_, i) => i + 1);
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
   * - (let x val code)
   * - (let x val code code code)
   * - (let ((a v1) (b v2) (c v3)) code)
   * - (let ((a v1) (b v2) (c v3)) code code code)
   *
   * Returns the last evaluated code expression
   */
  'let': new Special((ast, ctx) => {
    const rest = ast.splice(1);

    const scope = {};
    // FORM 1:
    if (!(rest[0] instanceof Array)) {

      // set param in ctx
      scope[rest[0].token] = evaluate(rest[1], ctx);
    }

    // FORM 2:
    else {
      for (const pair of rest[0]) {
        // set param in ctx
        scope[pair[0].token] = evalaute(pair[1], ctx);
      }
    }

    const innerCtx = new Context(scope, ctx);

    // execute all code after let definitions
    const afterLet = rest.splice(2);
    let evalResult;

    for (const code of afterLet) {
      evalResult = evaluate(code, innerCtx);
    }

    return evalResult; // only return last evaluated statement
    // END ---------------


    /// const rest = ast.splice(1);
    /// const code = rest.pop();

    /// // account for shortcut case where no brackets around single key value thing
    /// if (rest.length === 2 && !(rest[0] instanceof Array)) {
    ///   rest[0] = [rest[0], rest[1]];
    ///   rest.pop()
    /// }

    /// const scope = {};
    /// for (const vp of rest) {
    ///   if (!vp[0]) debugger;
    ///   scope[vp[0].token] = evaluate(vp[1], ctx);
    /// }
    /// const innerCtx = new Context(scope, ctx);

    /// return evaluate(code, innerCtx);
  }),

  /**
   * examples:
   * - (if cond true_exp false_exp)
   * - (if cond true_exp)
   * returns result.
   */
  'if': new Special((ast, ctx) => {
    const rest = ast.splice(1);

    const cond = evaluate(rest[0], ctx);

    if (cond)
      return evaluate(rest[1], ctx);
    else if (rest[2])
      return evaluate(rest[2], ctx);
    return undefined;
  }),

  /**
   * When a condition is true, return the value; else return default value.
   * examples:
   * - (when cond1 expr1 cond2 expr2 cond3 expr3 defaultexpr)
   * - (when cond1 expr1 cond2 expr2 cond3 expr3)
   * - (when defaultexpr)
   */
  'when': new Special((ast, ctx) => {
    for (let i = 1; i < ast.length; i+=2) {
      if (!ast[i + 1]) break;
      const [cond, expr] = [ast[i], ast[i + 1]];
      if (evaluate(cond, ctx))
        return evaluate(expr, ctx);
    }

    // if there is a default expr, evaluate it
    if ((ast.length - 1) % 2 === 1)
      return evaluate(ast[ast.length - 1], ctx);
  }),
};

export const std = standardLibrary;
export const specials = specialHandlers;
export { Special };

