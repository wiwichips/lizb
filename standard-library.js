import { Context } from './context.js';
import { evaluate, globalContext } from './eval.js';

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
  'or':  (...args) => args.reduce((a, c) => a || c, false),

  '>':  (left, right) => left > right,
  '>=': (left, right) => left >= right,
  '<':  (left, right) => left < right,
  '<=': (left, right) => left <= right,

  'cat': (...args) => args.join(''),
  'print': console.log,
  'list': (...args) => args,

  'debugger': (...x)=>{ debugger },

  'number': Number,
  'string': x=>`${x}`,

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
    const rest = Array.from(arguments).slice(1);
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
   * (reduce fn accumulator-default list1 list2 list3 ... listN)
   * where fn accepts (accumulator, num) parameters in that order...
   */
  'reduce': function filter_impl() {
    const fn = arguments[0];
    let acc = arguments[1];

    const inputList = [];
    for (let i = 2; i < arguments.length; i++)
      inputList.push(...arguments[i]);

    return inputList.reduce(((a,b) => fn(a,b)), acc);
  },

  /**
   * (pipe data fn1 fn2 fn3 fn4 ... fnN)
   */
  'pipe': (...args) => {
    let data = args[0];
    for (let i = 1; i < args.length; i++)
      data = args[i](data);
    return data;
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
  'len': lst => lst.length,

  'first':  lst => lst[0],
  'second': lst => lst[1],
  'rest':   lst => lst.slice(1),

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
   * forms:
   * - (fun (p1 p2 p3) (code))     - 1.  Regular
   * - (fun ((p1d p2d) p3) (code)) - 1a. Parameter deconstruction
   * - (fun params (code))         - 2.  Variadic
   * - (fun (code))                - 3.  No args
   */
  'fun': new Special((ast, ctx) => {
    const code = ast[ast.length - 1]; // code always last
    const arglist = ast.slice(0, ast.length -1);

    // process function parameter names
    let args = [];
    if (arglist.length > 0) {
      const argObj = arglist.pop();
      if (argObj instanceof Array) {
        for (const miniArg of argObj) {
          // 1a/ Parameter Deconstructions
          if (miniArg instanceof Array) {
            let microArgs = [];
            for (const microArg of miniArg)
              microArgs.push(microArg.token);
            args.push(microArgs);
          }
          // 1/ Regular Parameter
          else
            args.push(miniArg.token);
        }
      }
      // Variadic argument list
      else
        args = argObj.token;
    }

    // create a function which returns a function to execute based on the args passed
    function wrapper() {
      // define scope
      const scope = {};
      if (args instanceof Array) {
        for (let i = 0; i < Math.min(args.length, arguments.length); i++)
          // variable deconstruction
          if (args[i] instanceof Array) {
            const margs = args[i];

            for (let j = 0; j < Math.min(margs.length, arguments[i].length); j++)
              scope[margs[j]] = arguments[i][j];
          }
          // regular variable
          else
            scope[args[i]] = arguments[i];
      }
      else
        scope[args] = Array.from(arguments);
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
   * - (let (a v1 b v2 c v3) code)
   * - (let (a v1 b v2 c v3) code code code)
   *
   * Returns the last evaluated code expression
   */
  'let': new Special((ast, ctx) => {
    const rest = ast.slice(1);

    const scope = {};
    let afterLet = [];
    // FORM 1:
    if (!(rest[0] instanceof Array)) {

      // set param in ctx
      scope[rest[0].token] = evaluate(rest[1], ctx);
      afterLet = rest.slice(2);
    }

    // FORM 2:
    else {
      for (let i = 0; i < rest[0].length; i+=2) {
        let pair = [ rest[0][i], rest[0][i + 1] ];
        // set param in ctx
        scope[pair[0].token] = evaluate(pair[1], new Context(scope, ctx));
      }
      afterLet = rest.slice(1);
    }

    const innerCtx = new Context(scope, ctx);

    // execute all code after let definitions
    let evalResult;

    for (const code of afterLet) {
      evalResult = evaluate(code, innerCtx);
    }

    return evalResult; // only return last evaluated statement
  }),

  /**
   * Global variable.
   * example:
   * - (global varname expr)
   * - (global will 1) (print will) # prints 1
   */
  'global': new Special((ast, ctx) => {
    const rest = ast.slice(1);
    globalContext.props[rest[0].token] = evaluate(rest[1]);
    //return globalContext[rest[0].token];
  }),

  /**
   * examples:
   * - (if cond true_exp false_exp)
   * - (if cond true_exp)
   * returns result.
   */
  'if': new Special((ast, ctx) => {
    const rest = ast.slice(1);

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

