#!/usr/bin/env lizb

(global lines (map 
  (fun (line) (list
    (first line)
    (number (rest line))))
  (split (fs/read "./input.txt") "\n")))

(reduce (fun (accpair pair)
  (let
    (dir    (first  pair)
     count  (second pair)
     pos    (first  accpair)
     zeroes (second accpair)
     newpos (if (= dir "L")
      (mod (- pos count) 100)
      (mod (+ pos count) 100)))
    (list newpos (if (= pos 0) (+ zeroes 1) zeroes))))
  (list 50 0)
  lines)

