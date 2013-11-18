var NumberBar = mix("div.nubar", { }),

    HScrollBar = mix("div.scroll.horizontal > div", function () {
    var _mix = this._mix;

        onevent(this, "scroll", function (event) {
            _mix.onscroll(event);
            emit("horizontal-scroll", event, this.scrollLeft);
        });
    }, {
        onscroll: noop,
        setWidth: function (s, y) { this.node.style.width = s - (y || 0) + "px"; this.node.style.right = (y || 0) + "px"},
        setScrollLength: function (s) { this.node.firstElementChild.style.width  = s + "px"; }
    }),

    VScrollBar = mix("div.scroll.vertical > div", function () {
    var _mix = this._mix;

        onevent(this, "scroll", function (event) {
            _mix.onscroll(event);
            emit("vertical-scroll", event, this.scrollTop);
        });
    }, {
        onscroll: noop,
        setHeight: function (s, y) { this.node.style.height = s - (y || 0) + "px"; this.node.style.bottom = (y || 0) + "px";},
        setScrollLength: function (s) { this.node.firstElementChild.style.height  = s + "px"; }
    }),

    CodeBox = mix("div.code-box spellcheck='false'", function (id) {
    var _mix = this._mix,
        codesElement;

        if (id) this.id = id;

        _mix.cursor = new Cursor()._mix;
        _mix.codeMeasure = new CodeMeasure()._mix;
        _mix.codeHighlight = new CodeHighlight()._mix;
        _mix.lineBox = new LineBox(this, _mix.cursor, _mix.codeMeasure, _mix.codeHighlight)._mix;
        _mix.nubar = new NumberBar()._mix;
        _mix.hscrollbar = new HScrollBar()._mix;
        _mix.vscrollbar = new VScrollBar()._mix;

        codesElement = _mix.lineBox.node;

        // this.appendChild(markless("div.menubar > a href='javascript:void 0;' 'File'"));
        this.appendChild(_mix.lineBox.node);
        this.appendChild(_mix.cursor.node);
        this.appendChild(_mix.codeHighlight.node);
        this.appendChild(_mix.codeMeasure.node);
        this.appendChild(_mix.nubar.node);
        this.appendChild(_mix.hscrollbar.node);
        this.appendChild(_mix.vscrollbar.node);

        window.setTimeout( function () { // after DOM rendered
            _mix.codeMeasure.setLine("");
            _mix.codeHighlight.setBaseOffset( codesElement.offsetLeft, codesElement.offsetTop );
            _mix.cursor.setBaseOffset( codesElement.offsetLeft, codesElement.offsetTop );
            _mix.cursor.setPosition(0, 0);
            _mix.hscrollbar.setWidth( _mix.node.clientWidth - codesElement.offsetLeft, _mix.vscrollbar.node.offsetWidth );
            _mix.vscrollbar.setHeight( _mix.node.clientHeight, _mix.hscrollbar.node.offsetHeight );
        }, 0);
    }, {
        setCode: function (src) {
            this.lineBox.setCode(src);
            this.vscrollbar.setScrollLength( this.lineBox.node.scrollHeight );
            this.hscrollbar.setScrollLength( this.lineBox.node.scrollWidth );
        }
    });

