#!/usr/bin/env lizb

(global nums
  (call cat 
    (map
      (fun ((start end)) (range start (+ end 1)))
      (map
        (fun (x) (map number (split x "-")))
        (split (fs/read "./input.txt") ",")))))


(global stripeset (fun (s g offset)
  (map (f.i get s i) (range offset (len s) g))))

(global invalid? (fun (num)
  (if (< num 10) 0
    (let n (string num)
      (reduce or 0
        (map (fun (g)
          (if (mod (len n) g) 0
            (call and (map (fun (i)
              (call = (stripeset n g i)))
              (range g)))))
          (range 1 (+ (/ (len n) 2) 1))))))))

(reduce (fun (acc num)
  (if (invalid? num) (+ acc num) acc))
  0
  nums)

