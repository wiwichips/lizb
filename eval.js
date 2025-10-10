const std = require('./standard-library.js').lizglobal;

class Context {
  constructor(base={}, parent) {
    this.props = base;
    this.parent = parent;
  }

  get(name) {
    if (name in this.props)
      return this.props[name];

    else if (this.parent === undefined)
      return undefined;

    return this.parent.get(name);
  }
}

const globalContext = new Context(std);

function evalItem(obj, ctx = globalContext) {
  if (obj instanceof Array)
    return eval(obj);
  switch (obj.type) {
    case 'root':
      return x => x;
    case 'special':
      return obj.token;
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

function eval(ast, ctx = globalContext) {
  if (ast.length === 0)
    return [];

  const first = evalItem(ast[0]);
  const rest = [];

  for (let i = 1; i < ast.length; i++) {
    rest.push(evalItem(ast[i], ctx));
  }

  // execute function?
  return first.apply(undefined, [rest]);
}

// exports
exports.evalAst = eval;

