var Cursor = mix("div.code-cursor > input:text auotcomplete='off'", function () {
    var _mix = this._mix,
        textarea = this.children[0];

        _mix.baseX = _mix.baseY = 0;

/*                      IE<9    IE9+    FF      OPERA   SAFARI  CHROME
 * input                        YES     YES     YES     YES     YES
 * textInput                                            YES     YES
 * textinput                    YES
 * onpropertychange     YES     YES
 * Both the input and onpropertychange events are buggy in Internet Explorer 9, they are not fired when characters are deleted only when inserted.
*/
        // TODO: support browsers other than Chrome
        if (browser === "CHROME" || browser === "SAFARI" || browser === "IE9+")
            textarea.addEventListener(browser === "IE9+" ? "textinput" : "textInput", function (event) {
            // event.data = event.target.value;
            _mix.oninput.call(this, event, "input");
            this.value = "";
        });

        // A bug in FF that press ESC will trigger input event with last content, not know how to fix it, just leave it.
        if (browser === "FF" || browser === "OPERA")
            textarea.addEventListener("input", function (event) {
            event.data = event.target.value;
            _mix.oninput.call(this, event, "input");
            this.value = "";
        });

        textarea.addEventListener("blur", function (event) {
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

        textarea.addEventListener("keydown", function (event) {
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
            if (x != null) this.node.style.left = this.baseX + x + "px";
            if (y != null) this.node.style.top = this.baseY + y + "px";
            this.show();
            this.focus();
        },
        flash: function () {
            var style = this.node.style;
            style.borderLeftColor = style.borderLeftColor.length < 6 ? "transparent" : "black";
        },
        focus: function () {
            this.node.children[0].focus();
        }
    });

