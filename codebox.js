var NumberBar = mix("div.nubar", function () {
    var node = this; 
        onevent("horizontal-scroll", function (event, offset) {
            node.style.left = offset + "px";
        });

        onevent("textarea-resize", function (width, height, x) {
            if (x & 2) node.style.height = height + 30 + "px";
        });
    }),

    HScrollBar = mix("div.scroll.horizontal > div", function () {
    var _mix = this._mix;

        onevent(this, "scroll", function (event) {
            _mix.onscroll(event);
            emit.fire("horizontal-scroll", event, this.scrollLeft);
        });

        onevent("textarea-resize", function (width, height, x) {
            if (x & 1) _mix.setScrollLength(width);
        });
    }, {
        onscroll: noop,
        setWidth: function (s, y) { this.node.style.width = s - (y || 0) + "px"; this.node.style.right = (y || 0) + "px"},
        setScrollLength: function (s) { this.node.firstElementChild.style.width  = s + "px"; },
        scrollTo: function (s, y) {this.node.scrollLeft = s; if (y) emit.fire("horizontal-scroll", null, this.scrollLeft); }
    }),

    VScrollBar = mix("div.scroll.vertical > div", function () {
    var _mix = this._mix;

        onevent(this, "scroll", function (event) {
            _mix.onscroll(event);
            emit.fire("vertical-scroll", event, this.scrollTop);
        });

        onevent("textarea-resize", function (width, height, x) {
            if (x & 2) _mix.setScrollLength(height);
        });
    }, {
        onscroll: noop,
        setHeight: function (s, y) { this.node.style.height = s - (y || 0) + "px"; this.node.style.bottom = (y || 0) + "px";},
        setScrollLength: function (s) { this.node.firstElementChild.style.height  = s + "px"; },
        scrollTo: function (s, y) {this.node.scrollTop = s; if (y) emit.fire("vertical-scroll", event, this.scrollTop); }
    }),

    CodeBox = mix("div.boxwrap > div.code-box spellcheck='false'", function (id) {
    var _mix = this._mix,
        boxNode = this.firstElementChild,
        lineBoxNode;

        if (id) this.id = id;

        _mix.cursor = new Cursor()._mix;
        _mix.codeMeasure = new CodeMeasure()._mix;
        _mix.codeHighlight = new CodeHighlight()._mix;
        _mix.lineBox = new LineBox(this, _mix.cursor, _mix.codeMeasure, _mix.codeHighlight)._mix;
        _mix.nubar = new NumberBar()._mix;
        _mix.hscrollbar = new HScrollBar()._mix;
        _mix.vscrollbar = new VScrollBar()._mix;

        lineBoxNode = _mix.lineBox.node;

        // this.appendChild(markless("div.menubar > a href='javascript:void 0;' 'File'"));
        this.firstElementChild.appendChild(_mix.lineBox.node);
        this.firstElementChild.appendChild(_mix.cursor.node);
        this.firstElementChild.appendChild(_mix.codeHighlight.node);
        this.firstElementChild.appendChild(_mix.codeMeasure.node);
        this.firstElementChild.appendChild(_mix.nubar.node);
        this.appendChild(_mix.hscrollbar.node);
        this.appendChild(_mix.vscrollbar.node);

        onevent("horizontal-scroll", function (event, offset) {
            boxNode.scrollLeft = offset;
        });

        onevent("vertical-scroll", function (event, offset) {
            boxNode.scrollTop = offset;
        });

        onevent("cursor-position", function (left, top) {
        var pox = 0, lineHeight = _mix.lineBox.activeLine.node.offsetHeight,
            viewWidth = _mix.node.clientWidth - _mix.vscrollbar.node.offsetWidth,
            viewHeight = _mix.node.clientHeight - _mix.hscrollbar.node.offsetHeight;

            if (top - boxNode.scrollTop < 0) pox |= 1;
            if (left - boxNode.scrollLeft > viewWidth ) pox |= 2;
            if (top - boxNode.scrollTop + lineHeight > viewHeight ) pox |= 4;
            if (left - boxNode.scrollLeft - lineBoxNode.offsetLeft < 0) pox |= 8;

            if (!pox) return; // cursor in view, not need to scroll into view

            if (pox & 1) _mix.vscrollbar.scrollTo(top);
            if (pox & 2) _mix.hscrollbar.scrollTo( left - viewWidth );
            if (pox & 4) _mix.vscrollbar.scrollTo( top + lineHeight - viewHeight );
            if (pox & 8) _mix.hscrollbar.scrollTo(left - lineBoxNode.offsetLeft);
        });

        onevent(boxNode, "mousewheel", function (event) {
            defer(function () {
                _mix.hscrollbar.scrollTo(boxNode.scrollLeft);
                _mix.vscrollbar.scrollTo(boxNode.scrollTop);
            });
        });

        onevent(this, "scroll", function (event) {
            _mix.node.scrollTop = _mix.node.scrollLeft = 0;
        });

        defer( function () { // after DOM rendered
            _mix.codeMeasure.setLine("");
            _mix.codeHighlight.setBaseOffset( lineBoxNode.offsetLeft, lineBoxNode.offsetTop );
            _mix.cursor.setBaseOffset( lineBoxNode.offsetLeft, lineBoxNode.offsetTop );
            _mix.cursor.setPosition(0, 0);
            emit("box-resize", _mix.node.clientWidth, _mix.node.clientHeight);
            _mix.hscrollbar.setWidth( _mix.node.offsetWidth - lineBoxNode.offsetLeft, _mix.vscrollbar.node.offsetWidth );
            _mix.vscrollbar.setHeight( _mix.node.offsetHeight, _mix.hscrollbar.node.offsetHeight );
        });
    }, {
        setCode: function (src) {
        var n = this.lineBox.node;
            this.lineBox.setCode(src);
            // emit("textarea-resize", n.offsetWidth + n.offsetLeft, n.offsetHeight + n.offsetTop, 3);
            emit("textarea-resize", n.offsetWidth, n.offsetHeight, 3);
        }
    });

