#!/usr/bin/env lizb
#Author: Pasan Undugodage 

(global input (fs/read "./input.txt"))

(global lines ((f.x split x "\n") input))

(global H (len lines))
(global W (len (get lines 0)))

(global dirCheck 
        (fun (r c)
          (if (and (>= r 0) (< r H) (>= c 0) (< c W)) 
          (= (get (get lines r) c) "@") 0)))

(global dirs (where (fun ((r c))  
        (not (= r c 0)))
        (product 2 (list -1 0 1))))

(global countAdjacentRolls
        (fun (r c) 
          (reduce 
          (fun (acc (dr dc)) 
            (+ acc 
            (if (dirCheck (+ r dr) (+ c dc)) 1 0))) 0 dirs)))

(global countValidRollsInRow  
        (fun (r)
          (reduce
          (fun (acc c)
            (+ acc
            (if (and (dirCheck r c)
                     (< (countAdjacentRolls r c) 4)) 1 0 ))) 0 (range W))))

(global getTotalValidRollCount 
        (reduce 
          (fun (acc r )
          (+ acc (countValidRollsInRow r))) 0 (range H)))

(print getTotalValidRollCount)
