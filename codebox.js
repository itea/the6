var NumberBar = mix("div.nubar", function () {
    var node = this; 
        onevent(
        "horizontal-scroll", function (offset) {
            node.style.left = offset + "px";
        },
        "textarea-resize", function (width, height, x) {
            if (x & 2) node.style.height = height + 30 + "px";
        });
    }),

    HScrollBar = mix("div.scroll.horizontal > div", function () {
    var _mix = this._mix;

        onevent(
        this, "scroll", function (event) {
            _mix.onscroll(event);
            emit.fire("horizontal-scroll", this.scrollLeft);
        },
        "textarea-resize", function (width, height, x) {
            if (x & 1) _mix.setScrollLength(width);
        });
    }, {
        onscroll: noop,
        display: function (s) {
            if (s === true) this.node.style.display = "block";
            if (s === false) this.node.style.display = "none";
            else return this.node.style.display !== "none";
        },
        setWidth: function (s, y) {
            this.node.style.width = s + "px";
            if (y != null) this.node.style.right = (y || 0) + "px";
        },
        setScrollLength: function (s) { this.node.firstElementChild.style.width  = s + "px"; },
        scrollTo: function (s, y) {this.node.scrollLeft = s; if (y) emit.fire("horizontal-scroll", this.node.scrollLeft); }
    }),

    VScrollBar = mix("div.scroll.vertical > div", function () {
    var _mix = this._mix;

        onevent(
        this, "scroll", function (event) {
            _mix.onscroll(event);
            emit.fire("vertical-scroll", this.scrollTop);
        },
        "textarea-resize", function (width, height, x) {
            if (x & 2) _mix.setScrollLength(height);
        });
    }, {
        onscroll: noop,
        display: function (s) {
            if (s === true) this.node.style.display = "block";
            if (s === false) this.node.style.display = "none";
            else return this.node.style.display !== "none";
        },
        setHeight: function (s, y) {
            this.node.style.height = s + "px";
            if (y != null) this.node.style.bottom = (y || 0) + "px";
        },
        setScrollLength: function (s) { this.node.firstElementChild.style.height  = s + "px"; },
        scrollTo: function (s, y) {this.node.scrollTop = s; if (y) emit.fire("vertical-scroll", this.node.scrollTop); }
    }),

    CodeBox = mix("div.boxwrap > div.code-box spellcheck='false'", function (id) {
    var _mix = this._mix,
        boxNode = this.firstElementChild,
        lineBoxNode;

        if (id) this.id = id;

        _mix.cursor = new Cursor()._mix;
        _mix.codeMeasure = new CodeMeasure()._mix;
        _mix.codeHighlight = new CodeHighlight()._mix;
        _mix.lineBox = new LineBox()._mix;
        _mix.inputController = new InputController(_mix.lineBox, _mix.cursor, _mix.codeMeasure, _mix.codeHighlight);
        _mix.nubar = new NumberBar()._mix;
        _mix.hscrollbar = new HScrollBar()._mix;
        _mix.vscrollbar = new VScrollBar()._mix;

        lineBoxNode = _mix.lineBox.node;

        boxNode.appendChild(_mix.lineBox.node);
        boxNode.appendChild(_mix.cursor.node);
        boxNode.appendChild(_mix.codeHighlight.node);
        boxNode.appendChild(_mix.codeMeasure.node);
        boxNode.appendChild(_mix.nubar.node);
        this.appendChild(_mix.hscrollbar.node);
        this.appendChild(_mix.vscrollbar.node);

        onevent([
        "horizontal-scroll", function (offset) { boxNode.scrollLeft = offset; },
        "vertical-scroll", function (offset) { boxNode.scrollTop = offset; }
        ]);

        /*  each time the cursor was psotioned, check if need to scroll context
            to make the cursor show in view area */
    var scrollIntoView = function (left, top) {
        var pox = 0, lineHeight = _mix.lineBox.activeLine.node.offsetHeight,
            view = _mix.viewDimension,
            viewWidth = view.width,
            viewHeight = view.height;

            // if (left > 780) debugger;
            if (top - boxNode.scrollTop < 0) pox |= 1;
            if (left - boxNode.scrollLeft - lineBoxNode.offsetLeft > viewWidth ) pox |= 2;
            if (top - boxNode.scrollTop + lineHeight > viewHeight ) pox |= 4;
            if (left - boxNode.scrollLeft - lineBoxNode.offsetLeft < 0) pox |= 8;

            // log("scroll into view: " + pox);
            if (!pox) return; // cursor in view, not need to scroll into view

            if (pox & 1) _mix.vscrollbar.scrollTo(top);
            if (pox & 2) _mix.hscrollbar.scrollTo( left - viewWidth + lineBoxNode.offsetLeft);
            if (pox & 4) _mix.vscrollbar.scrollTo( top + lineHeight - viewHeight );
            if (pox & 8) _mix.hscrollbar.scrollTo(left - lineBoxNode.offsetLeft);
        };
        onevent("cursor-position", scrollIntoView);
        onevent("view-resize", function () {
            scrollIntoView( _mix.cursor.x, _mix.cursor.y );
        });

        onevent(boxNode, "mousewheel DOMMouseScroll", function (event) {
            defer(function () {
                _mix.hscrollbar.scrollTo(boxNode.scrollLeft);
                _mix.vscrollbar.scrollTo(boxNode.scrollTop);
            });
        });

        // prevent the wrap from scrolling
        onevent(this, "scroll", function (event) {
            _mix.node.scrollTop = _mix.node.scrollLeft = 0;
        });

        // onevent(["box-resize", "textarea-resize"], function () {
        onevent("box-resize textarea-resize", function () {
        var textWidth = _mix.lineBox.node.offsetWidth,
            textHeight = _mix.lineBox.node.offsetHeight,
            boxWidth = _mix.node.clientWidth,
            boxHeight = _mix.node.clientHeight,
            viewWidth = boxWidth - _mix.lineBox.node.offsetLeft - _mix.vscrollbar.node.offsetWidth,
            viewHeight = boxHeight - _mix.lineBox.node.offsetTop - _mix.hscrollbar.node.offsetHeight,
            x = 0;

            /* FF will not triger a scroll event when content size become small than parent container,
            // so we have to fire it manully using scrollbar.scrollTo() */
            _mix.hscrollbar.display( (x|=1, viewWidth < textWidth || !! void _mix.hscrollbar.scrollTo(0, true) ) );
            _mix.vscrollbar.display( (x|=2, viewHeight < textHeight || !! void _mix.vscrollbar.scrollTo(0, true)) );

            defer(function () {
            var view = _mix.viewDimension;
                /*  x & 1: vertical scroll bar showed;
                    x & 2: horizontal scroll bar showed.  */
                if (x & 2) viewWidth = boxWidth - _mix.lineBox.node.offsetLeft - _mix.vscrollbar.node.offsetWidth;
                if (x & 1) viewHeight = boxHeight - _mix.lineBox.node.offsetTop - _mix.hscrollbar.node.offsetHeight;

                _mix.vscrollbar.setHeight(viewHeight, x & 1 ? _mix.hscrollbar.node.offsetHeight : 0);
                _mix.hscrollbar.setWidth(viewWidth, x & 2 ? _mix.vscrollbar.node.offsetWidth : 0);

                // x & 1: width changed; x & 2: height changed.
                x = +(view.width !== viewWidth) | +(view.height !== viewHeight) << 1;
                if (x) {
                    view.width = viewWidth;
                    view.height = viewHeight;
                    view.left = _mix.lineBox.node.offsetLeft;
                    view.top = _mix.lineBox.node.offsetTop;
                    view.right = _mix.vscrollbar.node.offsetWidth;
                    view.bottom = _mix.hscrollbar.node.offsetHeight;
                    emit.fire("view-resize", view, x);
                }
            });
        });

        _mix.viewDimension = {width: 0, height: 0};

        defer(function () { // after DOM rendered
            _mix.codeMeasure.setLine("");
            _mix.codeHighlight.setBaseOffset( lineBoxNode.offsetLeft, lineBoxNode.offsetTop );
            _mix.cursor.setBaseOffset( lineBoxNode.offsetLeft, lineBoxNode.offsetTop );
            _mix.cursor.setPosition(0, 0, false);
            emit("box-resize", _mix.node.clientWidth, _mix.node.clientHeight);
        });
    }, {
        set: function (opt, value) {
            emit.fire("option-" + opt, value);
        },
        setCode: function (src) {
            this.lineBox.setCode(src);
        }
    });

