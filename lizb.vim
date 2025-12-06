" Syntax file for example Lisp-like language
" Save as: syntax/lizb.vim

if exists("b:current_syntax")
  finish
endif

" ------------------------
" Basic definitions
" ------------------------

" Comments: everything after # to end of line
syntax match lizbComment "#.*$"

" Strings: double-quoted, allow escaped quotes
syntax region lizbString start=/"/ skip=/\\"/ end=/"/

" Numbers: simple integers
syntax match lizbNumber "\v[-+]?\d+"

" Core keywords / special forms
syntax keyword lizbKeyword let fun map filer reduce list if when range global and or not = 

" js interop: js/<something>
syntax match lizbJsInterop "\vjs\/[A-Za-z0-9_.]*"

" Parens as delimiters
syntax match lizbParen "[()]"

" ------------------------
" Highlight links
" ------------------------

hi def link lizbComment  Comment
hi def link lizbString   String
hi def link lizbNumber   Number
hi def link lizbKeyword  Keyword
hi def link lizbJsInterop Function
hi def link lizbParen    Delimiter

let b:current_syntax = "lizb"

