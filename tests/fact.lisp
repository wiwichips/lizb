#!/usr/bin/env lizb

(global fac (fun (n)
  (if (< n 1)
    1
    (* n (fac (- n 1))))))
(fac 14)
(fac 1)
