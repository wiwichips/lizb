import { std, specials, Special } from './standard-library.js';
import { Context } from './context.js';

const globalContext = new Context(std);

function evalItem(obj, ctx = globalContext) {
  if (obj instanceof Array)
    return evaluate(obj, ctx);
  switch (obj.type) {
    case 'root':
      return (...x) => x;
    case 'special':
      return specials[obj.token];
    case 'number':
      return Number(obj.token);
    case 'string':
      let s = obj.token;
      s = s.replace('\\n', '\n');
      s = s.replace('\\t', '\t');
      s = s.replace('\\"', '\"');
      return s;
    case 'name':
      return ctx.get(obj.token);
  }
}

function evaluate(ast, ctx = globalContext) {
  if (!(ast instanceof Array))
    return evalItem(ast, ctx);
  if (ast.length === 0)
    return [];

  const first = evalItem(ast[0], ctx);

  if (first instanceof Special)
    return first.process(ast, ctx);

  const rest = [];

  for (let i = 1; i < ast.length; i++) {
    rest.push(evalItem(ast[i], ctx));
  }

  if (first instanceof Function)
    return first.apply(undefined, rest);

  // obj / maps act like functions where keys are arg
  else if (first instanceof Object && rest.length === 1)
    return first[rest[0]];
  throw new Error(`Invalid evaluation: (${first} -- ${rest})`);
}

// exports
export const evalAst = evaluate;
export { evaluate };

