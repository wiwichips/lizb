export function lexer(code) {
  let mode = 1; // 0 = comment, 1 = normal, 2 = string
  const tokens = [];
  let lineFirstCode = true;
  let lineno = 1;
  let fundent = 0; // last function expected indent
  let lindent = 0; // the current line's indent level
  let curtok = '';

  let debugNumOpenParen = 0;

  for (let i = 0; i < code.length; i++) {
    const c = code[i];

    if (mode === 0) {
      if (c === '\n') {
        endLine();
      }
      // otheriwse, ignore...
    }
    else if (mode === 2) {
      curtok += c;
      if (c === '"') {
        mode = 1;
      }
      if (i === code.length - 1)
        completeToken();
    }
    else if (c === '#') {
      mode = 0;
    }
    else if (c === '"') {
      mode = 2;
      curtok += '"';
    }
    else if (c === '.' && curtok === '') {
      handleIndentedCode();
      startDotList();
    }
    else if (c === '\n') {
      endLine();
    }
    else if (c === ' ' && (i && (code[i - 1] === ' ')) && lineFirstCode) {
      lindent += 1;
    }
    else if (c === '\t') {
      lindent += 1;
    }
    else if (c === ' ') {
      completeToken();
    }
    else if (c === '(') {
      debugNumOpenParen++;
      completeToken();
      tokens.push('(');
    }
    else if (c === ')') {
      // for debug only...
      debugNumOpenParen--;
      if (debugNumOpenParen < 0)
        throw new Error(`Extra close parenthesis detected\n  ${lineno}\t` + code.split('\n')[lineno - 1]);

      completeToken();
      tokens.push(')');
    }
    else if (i === code.length - 1) {
      curtok += c;
      completeToken();
    }
    else {
      curtok += c;
    }

  }
  lineFirstCode = true;
  handleIndentedCode();

  if (debugNumOpenParen !== 0) {
    const closeOrOpen = debugNumOpenParen > 0 ? "open" : "close";
    throw new Error(`${debugNumOpenParen} ${closeOrOpen} parenthesis detected\n  ${lineno}\t` + code.split('\n')[lineno - 1]);
  }

  //console.log(reconstructCode(tokens));

  return tokens;

  function completeToken() {
    if (curtok !== '')
      tokens.push(curtok);
    curtok = '';
  }

  function startDotList() {
    tokens.push('(_DOT');
    fundent++;
  }

  function handleIndentedCode() {
    if (!lineFirstCode)
      return;

    lineFirstCode = false;

    if (lindent === fundent) {
      // nothing to do
    } else if (lindent < fundent) {
      while (fundent > lindent) {
        tokens.push(')_DOT');
        fundent--;
      }
    } else {
      // impossible
      if (fundent !== 0)
        throw new Error(`Impossible indentation\n  ${lineno}\t` + code.split('\n')[lineno - 1]);
    }
  }

  function endLine() {
    mode = 1;
    completeToken();
    lindent = 0;
    lineno += 1;
  }
}

export function reconstructCode(tokens) {
  let nesting = 0;
  let rcode = '';
  let fdent = 0;
  for (let i = 0; i < tokens.length; i++) {
    let tok = tokens[i];
    if (tok === '(_DOT') {
      rcode += '  '.repeat(fdent);
      rcode += '.'
      fdent += 1;

      i++;
      let tok = tokens[i];

      rcode += tok;
      rcode += '\n'
    }
    else if (tok === ')_DOT') {
      fdent -= 1;
    }
    else if (tok === '(') {
      rcode += '  '.repeat(fdent);
      nesting = 1;
      rcode += '(';
      while (nesting > 0) {
        i += 1;
        tok = tokens[i];
        rcode += tok;
        rcode += ' ';

        if (tok === '(')
          nesting += 1;
        else if (tok === ')')
          nesting -= 1;
      }
    }
    else {
      rcode += '  '.repeat(fdent);
      rcode += tok;
      rcode += '\n';
    }
  }

  return rcode;
}


