#!/usr/bin/env lizb

(global batteries
  (map
    (fun (l) (map number ((js/eval "Array.from") l)))
    (where
      (f.l > (len l) 0)
      ((f.x split x "\n") (fs/read "./input2.txt")))))

(global take 12)

(global push (fun (s ch k)
  (if (and k s (> ch (last s)))
    (push (slice s 0 (- (len s) 1)) ch (- k 1))
    (list (cat s ch) k))))

# calculate the max joltage
(global max-joltage (fun (bank)
  (let
    (k (- (len bank) take)
     sksk
      (reduce (fun ((s kk) chi)
        (let
          (sk  (push s (get bank chi) kk)
           ss  (first sk)
           kkk (second sk))
          (list ss kkk)))
        (list "" k) (range (len bank)))
      finals (first sksk)
      finalk (second sksk))
    (if finalk)
      (number (slice (slice finals 0 (- (len finals) finalk)) 0 12))
    (number (slice finals 0 take)))))

(global batterysums (map max-joltage batteries))

(call + batterysums)

