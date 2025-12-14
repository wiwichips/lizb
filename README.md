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
