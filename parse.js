class Stack extends Array {
  peek() {
    return this[this.length - 1];
  }
}

class Obj {
  constructor(token, type) {
    this.token = token;
    this.type = type;
  }
}

function parse(tokens) {
  const root = new Obj('', 'root');
  const ast = [root];
  const stack = new Stack(ast);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token) {
      case ')':
        const popped = stack.pop();
        stack.peek().push(popped);
        break;

      case '(':
        stack.push([]);
        break;

      default:
        let obj = undefined;
        // string
        if (token[0] === '"' && token[token.length - 1] === '"')
          obj = new Obj(token.slice(1,-1), 'string');
        // number
        else if (!isNaN(token))
          obj = new Obj(Number(token), 'number');
        // special
        else if (['fun', 'let', 'if', 'when', 'global', 'f'].includes(token) || token.slice(0,2) == 'f.')
          obj = new Obj(token, 'special');
        // name
        else
          obj = new Obj(token, 'name');

        stack.peek().push(obj);
    }
  }
  return ast;
}

// exports
export const parser = parse;

