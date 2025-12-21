class Context {
  constructor(base={}, parent) {
    this.props = base;
    this.parent = parent;
  }

  get(name) {
    const parts = name.split(/(?<=[A-Za-z])[\/.](?=[A-Za-z])/);
    let value = undefined;

    if (parts[0] in this.props)
      value = this.props[parts[0]];
    else if (this.parent !== undefined)
      value = this.parent.get(parts[0]);

    if (parts.length === 1)
      return value;

    // module path
    for (const part of parts.slice(1)) {
      const receiver = value;
      value = receiver[part];

      if (typeof value === "function") {
        value = value.bind(receiver);
      }
    }

    return value;
  }
}

export { Context };
