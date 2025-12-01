export function lexer(code) {
  const tokens = [];
  let curtok = '';
  const modes = {
    DEFAULT: 0,
    STRING: 1,
    COMMENT: 2,
  };

  let mode = modes.DEFAULT;

  for (let i = 0; i < code.length; i++) {
    if (mode === modes.STRING) {
      if (code[i] === '"') {
        curtok += '"';
        mode = modes.DEFAULT;
      } else
        curtok += code[i];
    }
    else if (mode === modes.COMMENT) {
      if (code[i] === '\n')
        mode = modes.DEFAULT;
    } else if (code[i] === '#') {
      tokens.push(curtok);
      mode = modes.COMMENT;
    } else if (code[i] == '(') {
      tokens.push('(');
    } else if (code[i] == ')') {
      tokens.push(curtok);
      curtok = '';
      tokens.push(')');
    } else if (code[i] == '"') {
      curtok = '"';
      mode = modes.STRING;
    } else if (code[i] == ' ' || code[i] == '\n') {
      tokens.push(curtok);
      curtok = '';
    } else
      curtok += code[i];
  }

  // error
  const lpc = tokens.filter(x => x === '(').length;
  const rpc = tokens.filter(x => x === ')').length;
  if (lpc !== rpc)
    throw new Error(`Invalid parenthesis: '(':${lpc}, ')':${rpc}`);

  return tokens.filter((tok) => tok != '');
}

