import { Context } from './context.js';
import { evaluate, globalContext } from './eval.js';
import * as domLibrary from './lib/dom.js';


//import { readFileSync } from "node:fs"; // won't work in browser... TODO
let readFileSync = null;

if (typeof process !== "undefined" && process.versions?.node) {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  ({ readFileSync } = require("node:fs"));
}


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
  '/': (...args) => {
    let numerator = args[0];
    for (let i = 1; i < args.length; i++) {
      numerator = numerator / args[i];
    }
    return numerator;
  },
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

  'cat': (...args) => {
    let res = [];
    if (args.length === 0) return res;
    if (args[0] instanceof Array) {
      return [].concat(...args);
    }
    return args.join('');
  },
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
      result.push(fn(...lst)); // bug? should this be ...row)
    }
    return result;
  },

  /**
   * (reduce fn accumulator-default list1 list2 list3 ... listN)
   * or
   * (reduce fn list) <-- uses first element of list as acc
   * where fn accepts (accumulator, num) parameters in that order...
   */
  'reduce': function filter_impl() {
    const fn = arguments[0];
    let acc = arguments[1];
    let i = 2;

    // special case of form 2 (reduce fn list) <no acc>
    if (arguments.length === 2) {
      acc = arguments[1][0];
      i = 1;
      arguments[1] = arguments[1].slice(1);
    }

    const inputList = [];
    for (; i < arguments.length; i++) {
      for (let j = 0; j < arguments[i].length; j++)
        inputList.push(arguments[i][j]);
    }

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
   * Pass list as arguments to a function.
   * (call fn arg-list)
   */
  'call': (...args) => {
    const fn = args[0];
    const fargs = [];
    for (let i = 1; i < args.length; i++)
      fargs.push(...args[i]);
    return fn(...fargs);
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

  /**
   * (sorted lst)
   * (sorted fn lst)
   */
  'sorted': function sort_impl() {
    const lst2 = [];

    let cmp = undefined;
    let lst = arguments[0];

    if (arguments[0] instanceof Function)
      lst = arguments[1];

    for (let i = 0; i < lst.length; i++)
      lst2.push(lst[i]);

    if (cmp)
      lst2.sort(cmp);
    else
      lst2.sort();

    return lst2;
  },

  'fs': {
    read: (fname) => readFileSync(fname, 'utf8'),
  },

  'split': (s,d) => s.split(d),

  /**
   * (slice data start end)
   * (slice data start)
   */
  'slice': (...args) => {
    const data = args[0];
    const start = args[1];
    if (args.length < 3)
      return data.slice(start);
    const end = args[2];
    return data.slice(start, end);
  },
  'len': lst => lst.length,
  'get': (lst, idx) => lst[idx],
  'set': (lst, idx, newval) => {
    const old = lst[idx];
    lst[idx] = newval;
    return old;
  },

  'first':  lst => lst[0],
  'second': lst => lst[1],
  'rest':   lst => lst.slice(1),
  'last':   lst => lst[lst.length -1],

  'in': (key, lst) => key in lst,

  'enumerate': lst => {
    const ret = [];
    for (let i = 0; i < lst.length; i++)
      ret.push([i, lst[i]]);
    return ret;
  },

  /**
   * (range num) --> 0, ... num - 1
   * OR
   * (range start end) --> start, ... end - 1
   * OR
   * (range start end step)
   */
  'range': function() {
    let start = 0;
    let end   = arguments[0];
    let step = 1;
    if (arguments.length >= 2) {
      start = arguments[0];
      end   = arguments[1];
    }
    if (arguments.length === 3)
      step = arguments[2];

    const ret = [];
    for (let i = start; i < end; i += step)
      ret.push(i);
    return ret;
  },

  /**
   * Product of N lists like python itertools.product
   *
   * (product list1 list2 List3 ... listN)
   *
   * OR
   *
   * (product 2 lst) # which is same as (product lst lst)
   *
   * Examples:
   * (product (list 1 2 3) (list "a" "b")) # [[1,'a'], [2, 'a'], [3,'a'], [1, 'b'] ...
   */
  'product': function() {
    const lists = [];
    let out = [[]];

    if (arguments.length === 2 && !(arguments[0] instanceof Array)) {
      lists.push(arguments[1]);
      lists.push(arguments[1]);
    } else {
      for (let i = 0; i < arguments.length; i++)
        lists.push(arguments[i]);
    }

    // generate things
    for (const lst of lists) {
      const next = [];
      for (const combo of out) {
        for (const item of lst) {
          next.push([...combo, item]);
        }
      }
      out = next;
    }
    return out;
  },

  /**
   * Just a thin wrapper around js Object...
   *
   * Examples:
   * (dict)                       # empty
   * (dict k1 v1 k2 v2 ... kN vN) # standard
   */
  'dict': function() {
    const obj = {};

    // error case where off number of inputs

    for (let i = 0; i < arguments.length; i+=2) {
      obj[arguments[i]] = [arguments[i + 1]];
    }

    return obj;
  },
};

standardLibrary.dom = domLibrary;

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
    let otherCode = [];
    const code = ast[ast.length - 1]; // code always last
    const arglist = ast.slice(0, ast.length -1);

    // process function parameter names
    let args = [];
    if (arglist.length > 1) {
      const argObj = arglist[1];
      otherCode = arglist.slice(2, ast.length - 1);
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

      // execute all extra codes which aren't part of return
      for (const codeLine of otherCode)
        evaluate(codeLine, innerCtx);

      // execute function with new scope
      return evaluate(code, innerCtx);
    }

    return wrapper;
  }),

  /**
   * Anonymous function definition shortcut:
   * (f.p1.p2.pN fn expr1 expr2 exprN)
   * example: (f.x * x x)               # square fn, shorter than (fun (x) (* x x))
   *          (f print "hello world")   # just prints hello world
   */
  'f': new Special((ast, ctx) => {
    const args = ast[0].token.split('.').slice(1);
    const code = ast.slice(1);

    function wrapper() {
      const scope = {};
      for (let i = 0; i < Math.min(args.length, arguments.length); i++)
        scope[args[i]] = arguments[i];

      return evaluate(code, new Context(scope, ctx));
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

