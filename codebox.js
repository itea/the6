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

    CodeBox = mix("div.boxwrap > div.code-box spellcheck='false'", function () {
    var codeBox = this._mix,
        boxNode = this.firstElementChild,
        lineBoxNode;

    var cursor = codeBox.cursor = new Cursor()._mix,
        codeMeasure = codeBox.codeMeasure = new CodeMeasure()._mix,
        codeHighlight = codeBox.codeHighlight = new CodeHighlight()._mix,
        lineBox = codeBox.lineBox = new LineBox()._mix,
        nubar = codeBox.nubar = new NumberBar()._mix,
        hscrollbar = codeBox.hscrollbar = new HScrollBar()._mix,
        vscrollbar = codeBox.vscrollbar = new VScrollBar()._mix;

        bindControl(codeBox, lineBox, cursor, codeMeasure, codeHighlight),
        lineBoxNode = lineBox.node;

        boxNode.appendChild(lineBox.node);
        boxNode.appendChild(cursor.node);
        boxNode.appendChild(codeHighlight.node);
        boxNode.appendChild(codeMeasure.node);
        boxNode.appendChild(nubar.node);
        this.appendChild(hscrollbar.node);
        this.appendChild(vscrollbar.node);

        /*  each time the cursor was postioned, check if need to scroll context
            to make the cursor show in view area */
    var scrollIntoView = function (left, top) {
        var pox = 0, lineHeight = lineBox.activeLine.node.offsetHeight,
            view = codeBox.viewDimension,
            viewWidth = view.width,
            viewHeight = view.height;

            if (top - boxNode.scrollTop < 0) pox |= 1;
            if (left - boxNode.scrollLeft - lineBoxNode.offsetLeft > viewWidth ) pox |= 2;
            if (top - boxNode.scrollTop + lineHeight > viewHeight ) pox |= 4;
            if (left - boxNode.scrollLeft - lineBoxNode.offsetLeft < 0) pox |= 8;

            if (!pox) return; // cursor in view, not need to scroll into view

            if (pox & 1) vscrollbar.scrollTo(top);
            if (pox & 2) hscrollbar.scrollTo( left - viewWidth + lineBoxNode.offsetLeft);
            if (pox & 4) vscrollbar.scrollTo( top + lineHeight - viewHeight );
            if (pox & 8) hscrollbar.scrollTo(left - lineBoxNode.offsetLeft);
        };

        onevent([
        "cursor-position", scrollIntoView,
        "view-resize", function () { scrollIntoView( cursor.x, cursor.y ); },
        "horizontal-scroll", function (offset) { boxNode.scrollLeft = offset; },
        "vertical-scroll", function (offset) { boxNode.scrollTop = offset; },
        boxNode, "mousewheel DOMMouseScroll", function (event) {
            defer(function () {
                hscrollbar.scrollTo(boxNode.scrollLeft);
                vscrollbar.scrollTo(boxNode.scrollTop);
            });
        },
        // prevent the box wraper from scrolling
        codeBox.node, "scroll", function (event) { codeBox.node.scrollTop = codeBox.node.scrollLeft = 0; }
        ]);

        onevent("box-resize textarea-resize", function () {
        var textWidth = lineBox.node.offsetWidth,
            textHeight = lineBox.node.offsetHeight,
            boxWidth = codeBox.node.clientWidth,
            boxHeight = codeBox.node.clientHeight,
            viewWidth = boxWidth - lineBox.node.offsetLeft - vscrollbar.node.offsetWidth,
            viewHeight = boxHeight - lineBox.node.offsetTop - hscrollbar.node.offsetHeight,
            x = 0;

            /* FF will not triger a scroll event when content size become small than parent container,
            // so we have to fire it manully using scrollbar.scrollTo() */
            hscrollbar.display( (x|=1, viewWidth < textWidth || !! void hscrollbar.scrollTo(0, true) ) );
            vscrollbar.display( (x|=2, viewHeight < textHeight || !! void vscrollbar.scrollTo(0, true)) );

            defer(function () {
            var view = codeBox.viewDimension;
                /*  x & 1: vertical scroll bar showed;
                    x & 2: horizontal scroll bar showed.  */
                if (x & 2) viewWidth = boxWidth - lineBox.node.offsetLeft - vscrollbar.node.offsetWidth;
                if (x & 1) viewHeight = boxHeight - lineBox.node.offsetTop - hscrollbar.node.offsetHeight;

                vscrollbar.setHeight(viewHeight, x & 1 ? hscrollbar.node.offsetHeight : 0);
                hscrollbar.setWidth(viewWidth, x & 2 ? vscrollbar.node.offsetWidth : 0);

                // x & 1: width changed; x & 2: height changed.
                x = +(view.width !== viewWidth) | +(view.height !== viewHeight) << 1;
                if (x) {
                    view.width = viewWidth;
                    view.height = viewHeight;
                    view.left = lineBox.node.offsetLeft;
                    view.top = lineBox.node.offsetTop;
                    view.right = vscrollbar.node.offsetWidth;
                    view.bottom = hscrollbar.node.offsetHeight;
                    emit.fire("view-resize", view, x);
                }
            });
        });

        codeBox.viewDimension = {width: 0, height: 0};

        defer(function () { // after DOM rendered
            codeMeasure.setLine("");
            codeHighlight.setBaseOffset( lineBoxNode.offsetLeft, lineBoxNode.offsetTop );
            cursor.setBaseOffset( lineBoxNode.offsetLeft, lineBoxNode.offsetTop );
            cursor.setPosition(0, 0, false);
            emit("box-resize", codeBox.node.clientWidth, codeBox.node.clientHeight);
        });
    }, {
        set: function (opt, value) {
            emit.fire("option-" + opt, value);
        },
        setCode: function (src) {
            this.lineBox.setCode(src);
        }
    });

