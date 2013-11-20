var Cursor = mix("div.code-cursor > input:text auotcomplete='off'", function () {
    var _mix = this._mix,
        textarea = this.children[0];

        _mix.baseX = _mix.baseY = 0;

        textarea.value = " ";

/*                      IE<9    IE9+    FF      OPERA   SAFARI  CHROME
 * input                        YES     YES     YES     YES     YES
 * textInput                                            YES     YES
 * textinput                    YES
 * onpropertychange     YES     YES
 * Both the input and onpropertychange events are buggy in Internet Explorer 9, they are not fired when characters are deleted only when inserted.
*/
        // TODO: support browsers other than Chrome
        if (browser === "CHROME" || browser === "SAFARI" || browser === "IE9+")
            onevent(textarea, browser === "IE9+" ? "textinput" : "textInput", function (event) {
            // event.data = event.target.value;
            _mix.oninput.call(this, event, "input");
            textarea.value = "";
        });

        // A bug in FF that press ESC will trigger input event with last content, not know how to fix it, just leave it.
        if (browser === "FF" || browser === "OPERA")
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
            event.preventDefault();
        });

        onevent(textarea, "input", function (event) {
            // console.log("input"+ textarea.value + textarea.value.length);
            if (textarea.value.length === 0)
                _mix.oninput.call(this, event, "delete"); // delete
        });

        onevent(textarea, "contextmenu", function (event) {
            // _mix.beforeContextmenuPopup(event, _mix.inputController && !_mix.inputController.range.collapsed);
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
            case 67: // CTRL-C
            case 88: // CTRL-X
                // fix that Firefox must have selection then could do copy/cut operation
                if (event.ctrlKey && browser === "FF") {
                    textarea.value = " ";
                    textarea.select();
                }
                break;
            }
        });

        _mix.intervalHandler = window.setInterval(function () {
            _mix.flash();
        }, 500);
    }, {
        oninput: noop, // default dummy oninput callback function
        hide: function () { this.node.style.display = "none"; },
        show: function () { this.node.style.display = "block"; },
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
            emit("cursor-position", this.x, this.y);
            this.show();
            if (document.activeElement != this) this.focus();
        },
        flash: function (command) {
            var style = this.node.style;
            if (command) {
                if (command === "start") style.borderLeftWidth = "1px";
                else if (command === "stop") style.borderLeftWidth = "0px";
            }
            style.borderLeftColor = style.borderLeftColor.length < 6 ? "transparent" : "black";
        },
        focus: function () {
            this.node.children[0].focus();
        },
        beforeContextmenuPopup: function (x, y, selected) {
        var textarea = this.node.children[0],
            style = this.node.style,
            posX = style.left, posY = style.top;

            this.flash("stop");
            this.show();
            textarea.value = " ";
            textarea.focus();
            selected && textarea.select();
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
                textarea.value = "\t"; // hack, prevent select all after cancel contextmenu
                textarea.select();
                that.flash("start");
            };

            defer(cleaning);
        }
    });

