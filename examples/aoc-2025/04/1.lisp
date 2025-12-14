#!/usr/bin/env lizb

# image where 0 = void, 1 = paper
(global img
  (map
    (fun (line) (map
      (f.p if (= p ".") 0 1)
      ((js/eval "Array.from") line)))
    (where
      (f.line > (len line) 0)
      (split (fs/read "./input.txt") "\n"))))

# (img-get yval xval) --> pixel value
# 0 padding
(global img-get (f.y.x 
  if (or
      (< y 0)
      (< x 0)
      (>= y (len img))
      (>= x (len (get img 0))))
    0
    (get (get img x) y)))
(global img-get-p (fun ((y x)) (img-get y x)))

(map (fun ((y x))
  (- (call + (map (fun ((y2 x2))
    (img-get (- y y2) (- x x2)))
    (product 2 (list -1 0 1)))) (img-get 0 0)))
  (product (range (len img)) (range (len (get img 0)))))


