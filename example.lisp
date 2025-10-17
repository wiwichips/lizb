# simple math
(* (+ 2) (+ 1 7))

# js interop
(js/console.log "hello world from example.lisp") #after comment

(js/Math.max 100 123 77)

# let statment
(let (a 100) (b 7) (c 2) (+ a b c))
(let (a 2) (b 1) (c 7) (* (+ a) (+ b c)))

# functions
((fun (a b c) (+ a b c)) 2 3 4)
((fun (a b c) (* (+ a) (+ b c))) 2 1 7)
((fun variadic (js/console.log  variadic)) 2 3 4)

(map
  (fun (x) (* x x))
  (list 1 2 3 4 5 6))


