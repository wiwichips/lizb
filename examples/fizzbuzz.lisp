#!/usr/bin/env lizb

# using nested if statement
(map (fun (n)
    (if (div n 3)
        (if (div n 5) "fizzbuzz" "fizz")
        (if (div n 5) "buzz" n)))
    (range 50))

# using when statement
(map (fun (n)
    (when
        (and (div n 3) (div n 5)) "fizzbuzz"
        (div n 3) "fizz"
        (div n 5) "buzz"
        n))
    (range 50))

