# file stuff
(global input (dom/id "file"))
(global canvas (dom/id "canvas"))
(global ctx (canvas.getContext "2d"))

# functions
(global set-pixel (fun (pixels offset r g b a) 
  (set pixels (+ offset 0) r)
  (set pixels (+ offset 1) g)
  (set pixels (+ offset 2) b)
  (if (or a (= a 0))
    (set pixels (+ offset 3) a))))

(global grayscale (fun (pixels offset)
  (let avg (number (/ (+ (get pixels (+ offset 0))
                         (get pixels (+ offset 1))
                         (get pixels (+ offset 2))) 3))
    (set-pixel pixels offset avg avg avg))))
    
# process the damn image!
(global process-img (fun (ctx w h)
  (let
    (img-data (ctx.getImageData 0 0 w h)
     pixels (img-data "data"))

    (loop
      (f.o grayscale pixels o)
      (range 0 (len pixels) 4))

    (ctx.putImageData img-data 0 0))))
 

(dom/on input "change" (fun (e)
  # first draw the new image which was uploaded...
  (let
    (file (first (input "files"))
     img (js/eval "new Image()")
     url ((js/eval "x=>URL.createObjectURL(x)") file))
    (set img "onload" (fun (e)
      # clear canvas
      (ctx.clearRect 0 0 (canvas "width") (canvas "height"))

      # draw image uploaded
      (let
        (scale (js/Math.min
           (/ (canvas "width")  (img "width"))
           (/ (canvas "height") (img "height")))
         w (number (* (img "width")  scale))
         h (number (* (img "height") scale))
         x (number (/ (- (canvas "width")  w) 2))
         y (number (/ (- (canvas "height") w) 2)))
        (ctx.drawImage img 0 0 w h)

        # do image processing in this function
        (process-img ctx w h)))

    (set img "src" url)))))

