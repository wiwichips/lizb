#!/usr/bin/env lizb

(global batteries
  (map
    (fun (l) (map number ((js/eval "Array.from") l)))
    (where
      (f.l > (len l) 0)
      ((f.x split x "\n") (fs/read "./input.txt")))))

(global findmaxupto (fun (battery i upto msf hi)
  (if (>= i upto) (list hi msf)
    (findmaxupto
      battery
      (+ i 1)
      upto
      (if (> (get battery i) msf) (get battery i) msf)
      (if (> (get battery i) msf) i hi)))))

(global pairs (map (fun (nums)
    (let
      (p1 (findmaxupto nums 0 (- (len nums) 1) -1 -1)
      p2 (findmaxupto nums (+ (first p1) 1) (len nums) -1 -1))
      (list p1 p2)))
  batteries))

(global values (map (fun ((p1 p2))
  (+ (* (second p1) 10) (second p2)))
  pairs))

(call + values)

