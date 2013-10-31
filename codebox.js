var CodeBox = mix("div.code-box spellcheck='false' > ol.codes", function (id) {
        var _mix = this._mix,
            codesElement = this.querySelector("ol.codes");

        if (id) this.id = id;

        var mousedownInfo = {x:-1, y:-1},

            // find up to locate the CodeLine
            locateLine = function (node, topNode) {
                while (node != topNode) {
                    if (node._mix) return node._mix;
                    node = node.parentNode;
                }
                return null;
            },

            locateLineContentElement = function (lipre, topNode) {
                while (lipre != topNode) {
                    if (lipre.tagName === "PRE") return lipre;
                    lipre = lipre.parentNode;
                }
                return null;
            };

        this.addEventListener("mousedown", function (event) {
            var lipre = locateLineContentElement(event.target, this);
            if (lipre == null) return;

            _mix.codeHighlight.clearSelection();

            var lirect = lipre.getBoundingClientRect(),
                pos = _mix.codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            var codesRect = codesElement.getBoundingClientRect();
            mousedownInfo.x = event.clientX - codesRect.left;
            mousedownInfo.y = event.clientY - codesRect.top;
            mousedownInfo.target = event.target;
            mousedownInfo.position = pos;

            mousedownInfo.rangeStartNode = lipre.firstChild || lipre;
            mousedownInfo.range = document.createRange();
            // mousedownInfo.range.setStart( lipre.firstChild || lipre, pos.charIndex );
        });

        this.addEventListener("mousemove", function (event) {
            if (mousedownInfo.range == null) return;
            var lipre = locateLineContentElement(event.target, this);
            if (lipre == null) return;

            var lirect = lipre.getBoundingClientRect(),
                pos = _mix.codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            var range = mousedownInfo.range;
            if ( mousedownInfo.rangeStartNode == (lipre.firstChild || lipre) ) {
                // the same line
                if (pos.charIndex > mousedownInfo.position.charIndex ) {
                    range.setStart( mousedownInfo.rangeStartNode, mousedownInfo.position.charIndex );
                    range.setEnd( lipre.firstChild || lipre, pos.charIndex );
                } else {
                    range.setStart( lipre.firstChild || lipre, pos.charIndex );
                    range.setEnd( mousedownInfo.rangeStartNode, mousedownInfo.position.charIndex );
                }
            } else if (event.clientY - codesElement.getBoundingClientRect().top < mousedownInfo.y ) {
                range.setStart( lipre.firstChild || lipre, pos.charIndex );
                range.setEnd( mousedownInfo.rangeStartNode, mousedownInfo.position.charIndex );
            } else {
                range.setStart( mousedownInfo.rangeStartNode, mousedownInfo.position.charIndex );
                range.setEnd( lipre.firstChild || lipre, pos.charIndex );
            }
            _mix.codeHighlight.select( range, this.scrollTop, this.scrollLeft );
        });

        this.addEventListener("mouseup", function (event) {
            window.range = mousedownInfo.range;
            //mousedownInfo.range.detach();
            mousedownInfo.range = null;
        });

        this.addEventListener("click", function (event) {
            var lipre = locateLineContentElement(event.target, this);
            if (lipre == null) return;

            var lirect = lipre.getBoundingClientRect(),
                rect = this.getBoundingClientRect(),
                pos = _mix.codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top),
                scrollX = _mix.node.scrollLeft, scrollY = _mix.node.scrollTop;

            _mix.cursor.setPosition(pos.posX + scrollX, lirect.top - rect.top + pos.posY + scrollY);
            _mix.activeLine = lipre.parentNode._mix;
            _mix.columnIndex = pos.charIndex;
        });

        var setLinePosition = function (_mix, codeline, columnIndex, resetLineContent) {
            var pos;
            if (resetLineContent) _mix.codeMeasure.setLine( codeline.content() );
            pos = _mix.codeMeasure.measureByColumn( columnIndex );
            _mix.cursor.setPosition(pos.posX, codeline.node.offsetTop + pos.posY);
            _mix.columnIndex = pos.charIndex;
            scrollLineIntoView( codeline );
        };

        var cursorEventHandler = function (event) {
            var lineContent, activeLine = _mix.activeLine;
            if (event.data) { // this is textInput event
                // TODO proceed CRLF in event.data
                lineContent = activeLine.insert( _mix.columnIndex, event.data );
                setLinePosition( _mix, activeLine, _mix.columnIndex + event.data.length, true );
                return;
            }
            switch (event.keyCode) {
            case 8:  // Backspace
                if (_mix.columnIndex === 0) {
                    if ( activeLine.node.previousElementSibling ) {
                        _mix.activeLine = activeLine.node.previousElementSibling._mix;
                        lineContent = _mix.activeLine.content();
                        _mix.activeLine.append( activeLine.content() );
                        setLinePosition( _mix, _mix.activeLine, lineContent.length, true );
                        activeLine.node.parentNode.removeChild( activeLine.node );
                    } else break;
                } else {
                    lineContent = activeLine.deleteChar( _mix.columnIndex -1 );
                    setLinePosition( _mix, activeLine, _mix.columnIndex -1, true );
                }
                break;

            case 8: // Tab
                // TODO
                break;
            case 13: // Enter
                activeLine = activeLine.split( _mix.columnIndex )._mix;
                _mix.activeLine.node.parentNode.insertBefore( activeLine.node, _mix.activeLine.node.nextElementSibling );
                _mix.activeLine = activeLine;
                setLinePosition( _mix, activeLine, 0, true );
                break;

            case 35: // End
                setLinePosition( _mix, activeLine, activeLine.contentLength() );
                break;

            case 36: // Home
                setLinePosition( _mix, activeLine, 0 );
                break;

            case 46: // Delete
                if (_mix.columnIndex === activeLine.contentLength()) {
                    if ( activeLine.node.nextElementSibling ) {
                        activeLine = activeLine.node.nextElementSibling._mix;
                        _mix.activeLine.append( activeLine.content() );
                        activeLine.node.parentNode.removeChild( activeLine.node );
                        setLinePosition( _mix, _mix.activeLine, _mix.columnIndex, true );
                    } else break;
                } else {
                    lineContent = activeLine.deleteChar( _mix.columnIndex );
                    setLinePosition( _mix, activeLine, _mix.columnIndex, true );
                }
                break;

            case 37: // ArrowLeft
                if (_mix.columnIndex === 0) {
                    if ( activeLine.node.previousElementSibling ) {
                        activeLine = _mix.activeLine = activeLine.node.previousElementSibling._mix;
                        setLinePosition( _mix, activeLine, activeLine.contentLength() +1, true );
                    } else break;
                } else
                    setLinePosition( _mix, activeLine, _mix.columnIndex -1 );
                break;

            case 39: // ArrowRight
                if (_mix.columnIndex === activeLine.contentLength()) {
                    if ( activeLine.node.nextElementSibling ) {
                        activeLine = _mix.activeLine = activeLine.node.nextElementSibling._mix;
                        setLinePosition( _mix, activeLine, 0, true );
                    } else break;
                } else
                    setLinePosition( _mix, activeLine, _mix.columnIndex +1 );
                break;

            case 38: // ArrowUp
                if ( ! activeLine.node.previousElementSibling ) break;
                activeLine = _mix.activeLine = activeLine.node.previousElementSibling._mix;
                setLinePosition( _mix, activeLine, _mix.columnIndex, true );
                break;

            case 40: // ArrowDown
                if ( ! activeLine.node.nextElementSibling ) break;
                activeLine = _mix.activeLine = activeLine.node.nextElementSibling._mix;
                setLinePosition( _mix, activeLine, _mix.columnIndex, true );
                break;
            }
        };
        _mix.cursor = new Cursor(cursorEventHandler)._mix;
        _mix.codeMeasure = new CodeMeasure()._mix;
        _mix.codeHighlight = new CodeHighlight()._mix;

        this.appendChild(_mix.cursor.node);
        this.appendChild(_mix.codeHighlight.node);
        this.insertBefore(_mix.codeMeasure.node, this.children[0]);

        window.setTimeout( function () { // after DOM rendered
            _mix.codeMeasure.setLine("");
            _mix.codeHighlight.setBaseOffset( _mix.node.offsetLeft, _mix.node.offsetTop );
            _mix.cursor.setBaseOffset( codesElement.offsetLeft, codesElement.offsetTop );
            _mix.cursor.setPosition(0, 0);
        }, 0);
    }, {
        setCode: function (src) {
            var start = 0, lastIdx, linenumber = 1,
                eOl = this.node.querySelector("ol");
        
            while (true) {
                lastIdx = src.indexOf("\n", start);
                if (lastIdx == -1) lastIdx = src.length;
                
                eOl.appendChild(
                    new CodeLine( src.substring(start, lastIdx), start, linenumber )
                    );
        
                start = lastIdx +1;
                linenumber ++;
                if (start > src.length) break;
            }
            this.activeLine = this.node.querySelector("li")._mix;
            this.columnIndex = 0;
        }
    });

