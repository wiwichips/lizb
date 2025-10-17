# lizb
minimalistic sexp based programming language with js interop

I'll use it on my personal website to make it more personal

Example file:
```lisp
# simple math
(* (+ 3 1) (+ 6 1))

# js interop
(js/console.log "hello world")

# define functions
(let will (fun (a b) (+ a b)) (will 7 3))
```

usage
```
./run file.lizb
```

todo
- async / promise syntax
- better error handling
- cdn to use it in browsers
