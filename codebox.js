var CodeBox = mix("div.code-box spellcheck='false'", function (id) {
    var _mix = this._mix,
        codesElement;

        if (id) this.id = id;

        _mix.cursor = new Cursor()._mix;
        _mix.codeMeasure = new CodeMeasure()._mix;
        _mix.codeHighlight = new CodeHighlight()._mix;
        _mix.lineBox = new LineBox(this, _mix.cursor, _mix.codeMeasure, _mix.codeHighlight)._mix;

        codesElement = _mix.lineBox.node;

        this.appendChild(_mix.lineBox.node);
        this.appendChild(_mix.cursor.node);
        this.appendChild(_mix.codeHighlight.node);
        this.appendChild(_mix.codeMeasure.node);

        window.setTimeout( function () { // after DOM rendered
            _mix.codeMeasure.setLine("");
            _mix.codeHighlight.setBaseOffset( codesElement.offsetLeft, codesElement.offsetTop );
            _mix.cursor.setBaseOffset( codesElement.offsetLeft, codesElement.offsetTop );
            _mix.cursor.setPosition(0, 0);
        }, 0);
    }, {
        setCode: function (src) {
            this.lineBox.setCode(src);
        }
    });

