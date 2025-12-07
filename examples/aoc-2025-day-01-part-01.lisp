#!/usr/bin/env lizb

(global lines (map 
  (fun (line) (list
    (first line)
    (number (rest line))))
  (split (fs/read "./input.txt") "\n")))

(reduce (fun ((pos zeroes) (dir count))
  (let newpos (mod ((if (= dir "L") - +) pos count) 100)
    (list newpos (if (= newpos 0) (+ zeroes 1) zeroes))))
  (list 50 0)
  lines)


