var Cursor = (function () {

/*                      IE<9    IE9+    FF      OPERA   SAFARI  CHROME
 * input                        YES     YES     YES     YES     YES
 * textInput                                            YES     YES
 * textinput                    YES
 * onpropertychange     YES     YES
 * Both the input and onpropertychange events are buggy in Internet Explorer 9, they are not fired when characters are deleted only when inserted.
*/
var basicMethods = {
        oninput: noop, // default dummy oninput callback function
        hide: function () { this.node.style.display = "none"; },
        show: function () { this.node.style.display = "block"; },
        focus: function () { this.node.children[0].focus(); },

        setBaseOffset: function (x, y) {
            this.baseX = x;
            this.baseY = y;
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
            this.show();
            this.focus();
            if (arguments[2] !== false) emit("cursor-position", this.x, this.y);
        },

        flash: function (command) {
            var style = this.node.style;
            if (command) {
                if (command === "start") style.borderLeftWidth = "1px";
                else if (command === "stop") style.borderLeftWidth = "0px";
            }
            style.borderLeftColor = style.borderLeftColor.length < 6 ? "transparent" : "black";
        },

        beforeContextmenuPopup: function (x, y, selected) {
        var textarea = this.node.children[0],
            style = this.node.style,
            posX = style.left, posY = style.top;

            this.flash("stop");
            this.show();
            textarea.value = " ";
            textarea.focus();
            if (selected) {
                textarea.selectionStart = 0;
                textarea.selectionEnd = 1;
            }
            style.width = "80px";
            style.left = this.baseX + x - 5 + "px";
            style.top = this.baseY + y - 5 + "px";

        var that = this,
            cleaning = function () {
            var textarea = that.node.children[0],
                style = that.node.style;

                style.left = posX;
                style.top = posY;
                style.width = "0px";
                textarea.value = " ";
                textarea.selectionStart = 0;
                textarea.selectionEnd = 0;
                that.flash("start");
            };

            defer(cleaning);
        }
    },

    ChromeCursor = mix("div.code-cursor > input:text auotcomplete='off'", function () {
    var _mix = this._mix,
        textarea = this.children[0];

        _mix.baseX = _mix.baseY = 0;

        textarea.value = " ";

        onevent(textarea, "textInput", function (event) {
            _mix.oninput.call(this, event, "input");
            textarea.value = "";
        });

        onevent(textarea, "input", function (event) {
            if (textarea.value.length === 0)
                _mix.oninput.call(this, event, "delete"); // delete
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
            event.preventDefault();
        });

        onevent(textarea, "contextmenu", function (event) {
            _mix.oninput.call(this, event, "contextmenu");
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
            }
        });

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
                    textarea.select(); // seems FF will not triger select event, so using .select() to triger it.
                    textarea.value = "";
                }
                break;
            case 67: // CTRL-C
            case 88: // CTRL-X
                // fix that Firefox must have selection then could do copy/cut operation
                if (event.ctrlKey) {
                    textarea.value = " ";
                    textarea.selectionStart = 0;
                    textarea.selectionEnd = 1;
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
            // return; // Seems not able to show context menu for input options (cut/copy/paste/select-all)
        var textarea = this.node.children[0],
            style = this.node.style,
            posX = style.left, posY = style.top;

            this.flash("stop");
            this.show();
            textarea.focus();
            if (selected) {
                textarea.value = " ";
                textarea.selectionStart = 0;
                textarea.selectionEnd = 1;
            } else textarea.value = "";
            style.width = "80px";
            style.left = this.baseX + x - 15 + "px";
            style.top = this.baseY + y - 5 + "px";

        var that = this,
            cleaning = function () {
            var textarea = that.node.children[0],
                style = that.node.style;

                style.left = posX;
                style.top = posY;
                style.width = "0px";
                textarea.value = " "; // hack, prevent select all after cancel contextmenu
                textarea.selectionStart = 0;
                textarea.selectionEnd = 1;
                that.flash("start");
            };

            defer(cleaning, 0);
        }
    });

    return {
        "CHROME": ChromeCursor,
        "FF": FirefoxCursor
    }[browser];
}());

