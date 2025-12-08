#!/usr/bin/env lizb

(global nums
  (call cat 
    (map
      (fun ((start end)) (range start (+ end 1)))
      (map
        (fun (x) (map number (split x "-")))
        (split (fs/read "./input.txt") ",")))))

(global invalid? (fun (num)
  (let letters (string num)
    # if it's odd length, then it's guranteed valid
    (if (mod (len letters) 2) 0

      # otherwise check if it's invalid
      (let
        (i 0
         j (/ (len letters) 2)
         matches (map (fun (k)
          (=
            (get letters (+ i k))
            (get letters (+ j k)))) (range j)))
         (reduce and 1 matches))))))

(reduce (fun (acc num)
  (if (invalid? num) (+ acc num) acc))
  0
  nums)

