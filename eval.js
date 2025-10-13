const { std } = require('./standard-library.js');

class Context {
  constructor(base={}, parent) {
    this.props = base;
    this.parent = parent;
  }

  get(name) {
    const parts = name.split(/[./]/);
    let value = undefined;

    if (parts[0] in this.props)
      value = this.props[parts[0]];
    else if (this.parent !== undefined)
      value = this.parent.get(parts[0]);

    if (parts.length === 1)
      return value;

    // module path
    for (const part of parts.slice(1))
      value = value[part]; // todo: error handling

    return value;
  }
}

const globalContext = new Context(std);

function evalItem(obj, ctx = globalContext) {
  if (obj instanceof Array)
    return eval(obj);
  switch (obj.type) {
    case 'root':
      return (...x) => x;
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
  return first.apply(undefined, rest);
}

// exports
exports.evalAst = eval;

