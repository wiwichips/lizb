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

export { Context };
