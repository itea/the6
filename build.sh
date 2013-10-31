#!/bin/sh

case $1 in
debug)
    cat basic.js codebox.js codeline.js cursor.js measure.js highlight.js misc.js > the6.js
    ;;
*)
    cat intro.js basic.js codebox.js codeline.js cursor.js measure.js highlight.js misc.js outro.js > the6.js
    ;;
esac

