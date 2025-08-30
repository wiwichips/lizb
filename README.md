# lizb
minimalistic sexp based programming language with js interop

I'll use it on my personal website to make it more personal

Example file:
```lisp
# simple math
(* (+ 3 3 1 1 1) (+ 6 9))

# js interop
(console.log "hello world")

# define functions
(fun "(will) (a b) (+ a b)")

# executed defined functions
(will 7 3)
```

usage
```
./run file.lizb
```

todo
- async / promise syntax
- better error handling
- cdn to use it in browsers
