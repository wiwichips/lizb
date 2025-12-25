# lizb
minimalistic sexp based programming language with js interop

## fizzbuzz example
```lisp
(map (fun (n)
  (if (div n 3)
    (if (div n 5) "fizzbuzz" "fizz")
    (if (div n 5) "buzz" n)))
  (range 100))
```

## factorial example
```lisp
(global fac (fun (n)
  (if (< n 1)
    1
    (* n (fac (- n 1))))))

# prints '87178291200'
(print (fac 14))
```

## js interop
```lisp
(js/console.log "hello world")

(js/document.getElementbyId "primary-btn")
```

## usage
```
./run file.lizb
```

## todo
- async / promise syntax
- better error handling
- cdn to use it in browsers

ideas
- `(let (a b (list 1 2)) (print (+ a b)))` <-- list deconstruction in let statement
- `((fun ((a b)) (+ a b)) (list 1 2))` <-- list deconstruction in function def! cool
- `(in needle haystack)` <-- true or false, haystack could be hashmap
- `(enumerate lst)` <-- returns list of lists in form [ (idx1 val1) (idx2 val2) ... (idxn valn) ]
- `(get lst key1 key2 key3)` <-- same as `lst[key1][key2][key3]` in js



# lizb — Language & Standard Library Docs (WIP)

lizb is a small Lisp-like language that evaluates **S-expressions** and runs on a JavaScript host (Node or the browser). It’s designed to be tiny, hackable, and easy to interop with JS.

These docs focus on:
- core language forms (`if`, `when`, `let`, `global`, `fun`, `f.*`)
- the standard library (`standard-library.js`)
- browser DOM helpers (`lib/dom.js`)
- JS interop patterns that show up in your examples

---

*Documentation below authored by ai and has not been verified. Reference `standard-library.js` as the ultimate source of truth...*

## Table of contents

- [Quick start](#quick-start)
- [Syntax basics](#syntax-basics)
- [Evaluation model](#evaluation-model)
- [Scopes and name lookup](#scopes-and-name-lookup)
- [Core special forms](#core-special-forms)
  - [`(global name expr)`](#global-name-expr)
  - [`(let ...)`](#let-)
  - [`(if cond then [else])`](#if-cond-then-else)
  - [`(when ...)`](#when-)
  - [`(fun ...)`](#fun-)
  - [`(f.x.y ... expr...)`](#fxy--expr)
- [Data types](#data-types)
- [Standard library reference](#standard-library-reference)
  - [Arithmetic, comparisons, booleans](#arithmetic-comparisons-booleans)
  - [Strings, lists, and sequence ops](#strings-lists-and-sequence-ops)
  - [Higher-order functions](#higher-order-functions)
  - [Ranges and combinatorics](#ranges-and-combinatorics)
  - [Objects / dicts and indexing](#objects--dicts-and-indexing)
  - [Filesystem (Node only)](#filesystem-node-only)
- [DOM library (`dom/*`)](#dom-library-dom)
- [JS interop patterns](#js-interop-patterns)
- [Examples](#examples)
- [Notes / quirks (current implementation)](#notes--quirks-current-implementation)

---

## Quick start

lizb code is a tree of lists and atoms, evaluated like:

```lisp
(+ 1 2 3)         # => 6
(print "hello")   # prints hello
(list 1 2 3)      # => [1,2,3]
```

You can run lizb scripts in different ways depending on your setup (CLI runner, browser loader, etc.). Your HTML examples load:

```html
<script type="module" src="../../../web.js"></script>
<script type="text/lizb">
  (print "hello from lizb")
</script>
```

---

## Syntax basics

### Comments
Lines starting with `#` are comments.

```lisp
# this is a comment
(+ 1 2)
```

### Lists
Everything is an S-expression list:

```lisp
(fn arg1 arg2 ...)
```

### Atoms
lizb currently recognizes:
- **numbers**: `12`, `3.14`
- **strings**: `"hello"` (supports `\n`, `\t`, `\"` escapes)
- **names**: `x`, `myVar`, `dom/on`, `js/window/location`

---

## Evaluation model

An expression is evaluated as:

1. Evaluate the first item (the “callee”).
2. If it’s a **special form**, it gets the raw AST and controls evaluation.
3. Otherwise, evaluate each argument left-to-right.
4. Call the callee:
   - if it’s a JS `Function`: `fn(...args)`
   - if it’s an `Object` and you pass exactly **one** argument: return `obj[key]`

Examples:

```lisp
(+ 1 2)                 # calls the "+" function
((dict "a" 10) "a")     # object-as-function indexing => 10 (see dict notes)
```

---

## Scopes and name lookup

lizb uses nested `Context` objects:

- A `Context` has `props` (a JS object) and an optional `parent`.
- Name lookup walks up to the parent if needed.
- Names can contain `/` or `.` to navigate “module paths”.

### Module paths: `a/b/c` or `a.b.c`

Name lookup splits on `/` or `.` **only when it’s between letters** (so `dom/on` and `js/window` work). Each path step does:

- `value = value[part]`
- if that value is a function, it is **bound** to its receiver (`value.bind(receiver)`)

This is why DOM methods and JS methods can be used safely.

Example:

```lisp
# access a nested property
(global href js/window/location/href)

# call a bound method (gets correct "this")
((js/eval "x=>new URL(x)") href)
```

---

## Core special forms

Special forms are not regular functions — they control evaluation.

### `(global name expr)`

Define/update a global variable.

```lisp
(global count 0)
(print count)     # => 0
(global count (+ count 1))
```

> `global` writes into `globalContext.props`.

---

### `(let ...)`

Creates a new inner scope and evaluates one or more expressions inside it.

#### Form 1: single binding
```lisp
(let x 10
  (+ x 5))     # => 15
```

#### Form 2: multiple bindings
```lisp
(let (a 1 b 2 c 3)
  (+ a b c))   # => 6
```

Bindings evaluate in-order, and later bindings can see earlier ones.

---

### `(if cond then [else])`

Evaluates `cond`. If truthy, evaluates and returns `then`. Otherwise evaluates `else` if present.

```lisp
(if (> 3 2) "yes" "no")  # => "yes"
(if false (print "nope")) # => undefined
```

---

### `(when ...)`

A compact multi-branch conditional.

Pattern:
```lisp
(when
  cond1 expr1
  cond2 expr2
  ...
  defaultExpr?)   # optional
```

Returns the first matching expression result, otherwise the default (if provided), otherwise `undefined`.

```lisp
(when
  (= x 0) "zero"
  (< x 0) "neg"
  "pos")
```

---

### `(fun ...)`

Defines a function. Supported forms:

1) Regular params  
```lisp
(fun (x y) (+ x y))
```

2) Variadic params (single name captures list of args)  
```lisp
(fun args (len args))
```

3) No-args function  
```lisp
(fun (print "hi"))
```

4) Parameter destructuring (list/tuple unpacking)  
```lisp
(fun ((a b) c)
  (+ a b c))

((fun ((a b) c) (+ a b c)) (list 1 2) 3)  # => 6
```

#### Multiple expressions inside a function

`fun` supports extra expressions before the “return” expression (the last expression).

```lisp
(fun (x)
  (print "x is" x)
  (* x x))
```

---

### `(f.x.y ... expr...)`

An anonymous function shortcut.

Form:
```lisp
(f.x.y <expr1> <expr2> ... <exprN>)
```

- The parameter names come from the token: `f.x.y` → params `x`, `y`
- The body is the remaining expressions (evaluated in sequence)
- The result is the result of the final expression

Examples:

```lisp
(f.x * x x)            # square
(map (f.x * x x) (range 5))  # => [0,1,4,9,16]

(f print "hello")      # prints "hello"
```

---

## Data types

lizb values are JS values:

- **Number** (JS number)
- **String**
- **Boolean**
- **List** (JS Array)
- **Object** (plain JS object)
- **Function** (JS function; includes lizb functions created by `fun` and `f.*`)

Truthiness follows JavaScript rules.

---

## Standard library reference

The global context starts with `std` from `standard-library.js`.

### Arithmetic, comparisons, booleans

```lisp
(+ 1 2 3)     # 6
(- 10 3)      # 7
(- 5)         # -5
(* 2 3 4)     # 24
(/ 20 2 5)    # 2

(mod 10 3)    # 1
(div 10 5)    # true  (checks divisible: dividend % divisor === 0)

(= 1 1 1)     # true
(> 3 2)       # true
(<= 2 2)      # true

(not true)    # false
(and true false true)  # false
(or false 0 "" "x")    # "x" (JS truthiness)
```

---

### Strings, lists, and sequence ops

```lisp
(cat "a" "b" "c")             # "abc"
(cat (list 1 2) (list 3 4))    # [1,2,3,4]  (concats lists)

(list 1 2 3)  # [1,2,3]
(len (list 1 2 3))  # 3

(first (list 10 20))   # 10
(second (list 10 20))  # 20
(last (list 10 20 30)) # 30
(rest (list 10 20 30)) # [20,30]

(get (list "a" "b") 1)     # "b"
(set (list "a" "b") 0 "z") # returns old value "a" and mutates list to ["z","b"]

(slice (list 1 2 3 4) 1)      # [2,3,4]
(slice (list 1 2 3 4) 1 3)    # [2,3]
(split "a,b,c" ",")           # ["a","b","c"]
```

Membership:

```lisp
(in 0 (list "a" "b"))     # true/false (JS "in" operator; checks index/property)
(in "length" (list 1 2))  # true
```

---

### Higher-order functions

#### `map`
```lisp
(map (f.x * x 2) (list 1 2 3))  # [2,4,6]
```

`map` also accepts multiple lists to “zip” values into the function (see quirks).

#### `loop` (for side effects)
```lisp
(loop print (list 1 2 3))   # prints 1, 2, 3
```

#### `reduce`
Two forms:

1) With explicit accumulator:
```lisp
(reduce + 0 (list 1 2 3))   # 6
```

2) Without accumulator (uses first list element):
```lisp
(reduce + (list 1 2 3))     # 6
```

#### `where` (filter)
```lisp
(where (f.x > x 10) (list 5 12 30))  # [12,30]
```

#### `unique`
```lisp
(unique (list 1 1 2 3 3))  # [1,2,3]
```

#### `sorted`
```lisp
(sorted (list 3 1 2))  # [1,2,3]
```

#### `pipe`
Pass a value through a sequence of functions.

```lisp
(pipe
  "a,b,c"
  (f.x split x ",")
  (f.x len x))         # 3
```

#### `call`
Pass a list as a function’s arguments.

```lisp
(call + (list 1 2 3 4))  # 10
```

---

### Ranges and combinatorics

#### `range`
```lisp
(range 5)         # [0,1,2,3,4]
(range 2 6)       # [2,3,4,5]
(range 0 10 2)    # [0,2,4,6,8]
```

#### `enumerate`
```lisp
(enumerate (list "a" "b"))  # [[0,"a"], [1,"b"]]
```

#### `product`
Cartesian product of lists.

```lisp
(product (list 1 2) (list "a" "b"))
# => [[1,"a"], [1,"b"], [2,"a"], [2,"b"]]

(product 2 (list 0 1))
# => same as (product (list 0 1) (list 0 1))
```

---

### Objects / dicts and indexing

#### `dict`
Creates a plain JS object.

```lisp
(global d (dict "a" 1 "b" 2))
```

Objects can also be used like a function with one argument:

```lisp
(d "a")    # => 1  (see notes)
```

You can also access properties by using module-path lookup:

```lisp
(global win js/window)
(win "location")          # object indexing style
js/window/location/href   # name lookup style
```

---

### Filesystem (Node only)

When running under Node, `fs/read` uses `readFileSync`.

```lisp
(fs/read "./input.txt")  # file contents as string
```

In the browser, `fs/read` will not work (no `readFileSync`).

---

## DOM library (`dom/*`)

`dom/*` lives under `std.dom`, so you can call it as `dom/query`, `dom/on`, etc.

### `dom/query`
Select first element matching a CSS query.

```lisp
(global header (dom/query "#header"))
(set header "textContent" "Hello")
```

### `dom/id`
Get element by ID.

```lisp
(global btn (dom/id "btn"))
```

### `dom/on`
Add an event listener.

```lisp
(dom/on (dom/query "#btn") "click"
  (fun (e)
    (print "clicked")))
```

### `dom/off`
Remove an event listener (must pass same callback reference).

### `dom/once`
One-time event listener.

```lisp
(dom/once (dom/query "#btn") "click" (f print "first click only"))
```

> All event helpers validate that the target has `addEventListener`, and throw a clear error if not.

---

## JS interop patterns

You have two main interop styles:

### 1) Module-path lookup for globals

Anything in `std` can be reached by a path name:

```lisp
js/window/location/href
js/history/replaceState
```

Functions reached through paths are **bound** to their receiver automatically.

### 2) `js/eval` for one-off helpers

Sometimes you want a tiny JS lambda:

```lisp
((js/eval "x=>new URL(x)") href)

# convert iterable to array
((js/eval "Array.from") someIterable)
```

---

## Examples

### FizzBuzz with `when`
```lisp
(map (fun (n)
    (when
      (and (div n 3) (div n 5)) "fizzbuzz"
      (div n 3) "fizz"
      (div n 5) "buzz"
      n))
  (range 50))
```

### Counter (DOM click handler)
```lisp
(global count 0)

(dom/on (dom/query "#btn") "click" (fun e
  (global count (+ count 1))
  (set (dom/query "#header") "textContent" (cat "Count:" count))))
```

### “Textarea pastebin” idea (URL param storage)
```lisp
(global article (dom/query "article"))
(global href js/window/location/href)
(global url ((js/eval "x=>new URL(x)") href))
(global start ((js/eval "u=>u.searchParams.get('text')") url))

(if start (set article "textContent" (js/atob start)))

(global update-url (fun (event)
  (let (text (article "textContent")
        encoded (js/btoa text))
    ((js/eval "(u,k,v)=>u.searchParams.set(k,v)") url "text" encoded)
    (js/history/replaceState 0 "" url))))

(dom/on article "input" update-url)
```

---

## Notes / quirks (current implementation)

These are behaviors that come directly from the current JS source:

- **String escapes are single replace**, not global replace.  
  Only the first `\n`, `\t`, `\"` occurrence is replaced.

- **Object-as-function indexing only triggers when**:
  - callee is an `Object`
  - **exactly one** argument is passed  
  Then it returns `obj[key]`.

- **`map` with multiple lists has a bug** in `standard-library.js`: it builds a `row` but calls `fn(...lst)` instead of `fn(...row)`.  
  Until fixed, multi-list mapping may behave incorrectly.

- **`dict` stores values as one-element arrays**:  
  `obj[key] = [value]` (note the brackets).  
  If you want plain values, change it to `obj[key] = value`.

- **`sorted(fn, lst)` signature is documented but comparator isn’t wired**:  
  The code detects a function argument but never assigns it to `cmp`, so custom comparators currently won’t be used.

- **`fs/read` works only in Node**. In the browser, `readFileSync` is `null`.

---

## Contributing / extending the standard library

The standard library is just a JS object (`std`) inserted into the global context:

- Add new functions by adding properties on `standardLibrary`.
- Add new special forms by adding to `specialHandlers` (as `new Special((ast, ctx) => ...)`).

If you add a new module, you can attach it as a nested object:

```js
standardLibrary.myModule = {
  hello: () => "hi",
};
```

Then call it in lizb as:

```lisp
(myModule/hello)
```
