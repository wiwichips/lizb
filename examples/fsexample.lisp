#!/usr/bin/env lizb

#format in: `artist,album,song,date,\n`
(let lines (split (fs/read "/home/will/git/lizb/examples/wiwichips.csv") "\n")
    # print number of lines in dataset
    #(print (lines "length"))

    (print (len lines))

    # print artists
    (let artists (unique (map (fun (x) (first (split x ","))) lines))
        (print artists)
        (print (len artists))))
