var Cursor = (function () {

/*                      IE<9    IE9+    FF      OPERA   SAFARI  CHROME
 * input                        YES     YES     YES     YES     YES
 * textInput                                            YES     YES
 * textinput                    YES
 * onpropertychange     YES     YES
 * Both the input and onpropertychange events are buggy in Internet Explorer 9, they are not fired when characters are deleted only when inserted.
*/
var bindEvents = function (handlers, node) {
var i = 0, eventType, fn;

    log(handlers);
    for (; i< handlers.length; i++) {
        fn = handlers[i];
        if (typeof fn === "string") eventType = fn;
        else node.addEventListener(eventType, fn);
    }
},
overrideHandler = function (handlers, type, f) {
var i = 0, eventType, fn;
    for (; i< handlers.length; i++) {
        fn = handlers[i];
        if (typeof fn === "string") eventType = fn;
        if (eventType !== type) continue;
        i++;
        while (typeof handlers[i] === "function") handlers.splice(i, 1);
        handlers.splice(i, 0, f);
    }
};

var basicMethods = {
        oninput: noop, // default dummy oninput callback function
        hide: function () { this.node.style.display = "none"; return this; },
        show: function () { this.node.style.display = "block"; return this; },
        focus: function (needDefer) {
        var that = this;
            // if (document.activeElement == this.node.children[0]) return;
            this.node.children[0].focus();
            return this;
        },

        reset: function () {
            this.node.children[0].value = "";
        },

        setBaseOffset: function (x, y) {
            this.baseX = x;
            this.baseY = y;
            return this;
        },

        setPosition: function (x, y) {
            if (x != null) {
                this.x = this.baseX + x;
                this.node.style.left = this.x + "px";
            }
            if (y != null) {
                this.y = this.baseY + y;
                this.node.style.top = this.y + "px";
            }
            this.show().focus();
            if (arguments[2] !== false) emit("cursor-position", this.x, this.y);
        },

        flash: function (command) {
            var style = this.node.style;
            if (command) {
                if (command === "start") style.borderLeftWidth = "1px";
                else if (command === "stop") style.borderLeftWidth = "0px";
            }
            style.borderLeftColor = style.borderLeftColor.length < 6 ? "transparent" : "black";
            return this;
        },

        beforeContextmenuPopup: function (x, y, selected, r) {
        var textarea = this.node.children[0],
            style = this.node.style,
            posX = style.left, posY = style.top;
            that = this,
            cleaning = function () {
            var textarea = that.node.children[0],
                style = that.node.style;

                style.left = posX;
                style.top = posY;
                style.width = "0px";
                textarea.value = " ";
                textarea.setSelectionRange(0,1);
                // textarea.selectionStart = 1;
                // textarea.selectionEnd = 1;
                that.flash("start");
            };


            this.flash("stop").show().focus();
            textarea.value = " ";
            if (selected) {
                textarea.selectionStart = 0;
                textarea.selectionEnd = 1;
            }
            style.width = "80px";
            style.left = this.baseX + x - 15 + "px";
            style.top = this.baseY + y - 5 + "px";

            if (r) return cleaning;
            else defer(cleaning);
        }
    },

    ChromeCursor = mix("div.code-cursor > input:text auotcomplete='off'", function () {
    var _mix = this._mix,
        textarea = this.children[0];

        _mix.baseX = _mix.baseY = 0;
        textarea.value = "";

    var handlers = [
        "focus", function (event) {
            // emit("cursor-focus");
            event.target.value = "";
        },
        "blur", function (event) {
            // emit("cursor-blur");
            _mix.hide();
        },
        "copy", function (event) {
            _mix.oninput.call( this, event, "copy" );
            event.preventDefault();
        },
        "cut", function (event) {
            _mix.oninput.call( this, event, "cut" );
            event.preventDefault();
        },
        "paste", function (event) {
            _mix.oninput.call( this, event, "paste" );
            event.preventDefault();
        },
        "select", function (event) {
            _mix.oninput.call(this, event, "select"); // select all
            // clean input element, prevent infinit select event
            // event.target.selectionEnd = 1;
            // event.preventDefault();
        },
        "contextmenu", function (event) {
            _mix.oninput.call(this, event, "contextmenu");
        },
        "input", function (event) {
            if (event.target.value.length === 0)
                _mix.oninput.call(this, event, "delete"); // delete
            // setting textarea.value = "" will cause input method doesnt work
        },
        "keydown", function (event) {
            switch (event.keyCode) {
            case 8:  // Backspace
            case 9:  // Tab
            case 13: // Enter
            case 27: // Esc
            case 46: // Delete
            case 33: // PageUp
            case 34: // PageDown
            case 35: // End
            case 36: // Home
            case 37: // ArrowLeft
            case 38: // ArrowUp
            case 39: // ArrowRight
            case 40: // ArrowDown
                _mix.oninput.call(this, event);
                event.preventDefault();
                break;
            }
        }];

        if (browser === "CHROME") {
            handlers.push(
            "textInput", function (event) {
                _mix.oninput.call(this, event, "input");
            },
            "keydown", function (event) {
                if (event.keyCode === 65 && event.ctrlKey) {
                    event.target.value = " ";
                    defer(function () { event.target.value = ""; });
                }
            });
        } else if (browser === "FF") {
            overrideHandler(handlers, "input", function (event) {
                event.data = event.target.value;
                _mix.oninput.call(this, event, "input");
                textarea.value = "";
            });
            handlers.push(
            "keydown", function (event) {
                switch (event.keyCode) {
                case 65: // CTRL-A
                    if (event.ctrlKey) {
                        textarea.value = " ";
                        // seems FF will not triger select event, so using .select() to triger it.
                        textarea.select();
                        defer(function () { event.target.value = ""; });
                    }
                    break;
                case 67: // CTRL-C
                case 88: // CTRL-X
                    // fix that Firefox must have selection then could do copy/cut operation
                    if (event.ctrlKey) {
                        textarea.value = " ";
                        textarea.selectionStart = 0;
                        textarea.selectionEnd = 1;
                        defer(function () { event.target.value = ""; });
                    }
                    break;
                }
            });
            _mix.beforeContextmenuPopup = function (x, y, selected) {
            var cleaning = basicMethods.beforeContextmenuPopup.call(this, x, y, selected, true);
                defer(cleaning, 1000);
            }
        }

        bindEvents(handlers, textarea);

        _mix.intervalHandler = window.setInterval(function () {
            _mix.flash();
        }, 500);
    }, basicMethods),

    FirefoxCursor = mix("div.code-cursor > input:text auotcomplete='off'", function () {
    var _mix = this._mix,
        textarea = this.children[0];

        _mix.baseX = _mix.baseY = 0;

        textarea.value = "";

        // A bug in FF that press ESC will trigger input event with last content, not know how to fix it, just leave it.
        onevent(textarea, "input", function (event) {
            event.data = event.target.value;
            _mix.oninput.call(this, event, "input");
            textarea.value = "";
        });

        onevent(textarea, "blur", function (event) {
            _mix.hide();
        });

        onevent(textarea, "copy", function (event) {
            _mix.oninput.call( this, event, "copy" );
            event.preventDefault();
        });

        onevent(textarea, "cut", function (event) {
            _mix.oninput.call( this, event, "cut" );
            event.preventDefault();
        });

        onevent(textarea, "paste", function (event) {
            _mix.oninput.call( this, event, "paste" );
            event.preventDefault();
        });

        onevent(textarea, "select", function (event) {
            _mix.oninput.call(this, event, "select"); // select all
            // clean input element, prevent infinit select event
            event.target.selectionEnd = 0;
            event.target.value = "";
            event.preventDefault();
        });

        onevent(textarea, "input", function (event) {
            if (textarea.value.length === 0)
                _mix.oninput.call(this, event, "delete"); // delete
        });

        onevent(textarea, "contextmenu", function (event) {
            // _mix.oninput.call(this, event, "contextmenu");
        });

        onevent(textarea, "keydown", function (event) {
            switch (event.keyCode) {
            case 8:  // Backspace
            case 9:  // Tab
            case 13: // Enter
            case 27: // Esc
            case 46: // Delete
            case 33: // PageUp
            case 34: // PageDown
            case 35: // End
            case 36: // Home
            case 37: // ArrowLeft
            case 38: // ArrowUp
            case 39: // ArrowRight
            case 40: // ArrowDown
                _mix.oninput.call(this, event);
                event.preventDefault();
                break;
            case 65: // CTRL-A
                if (event.ctrlKey) {
                    textarea.value = " ";
                    // seems FF will not triger select event, so using .select() to triger it.
                    textarea.select();
                    defer(function () { event.target.value = ""; });
                }
                break;
            case 67: // CTRL-C
            case 88: // CTRL-X
                // fix that Firefox must have selection then could do copy/cut operation
                if (event.ctrlKey) {
                    textarea.value = " ";
                    textarea.selectionStart = 0;
                    textarea.selectionEnd = 1;
                    defer(function () { event.target.value = ""; });
                }
                break;
            }
        });

        _mix.intervalHandler = window.setInterval(function () {
            _mix.flash();
        }, 500);
    },
    basicMethods,
    {
        beforeContextmenuPopup: function (x, y, selected) {
        var cleaning = basicMethos.beforeContextmenuPopup(x, y, selected, true);
            defer(cleaning, 1000);
        }
    });

    return {
        "CHROME": ChromeCursor,
        "FF": ChromeCursor,
    }[browser];
}());

