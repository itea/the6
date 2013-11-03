var InputController = function (lineBox, cursor, codeMeasure) {

    var setLinePosition = function (lineBox, codeline, columnIndex, resetLineContent) {
        var pos;
            if (resetLineContent) codeMeasure.setLine( codeline.content() );
            pos = codeMeasure.measureByColumn( columnIndex );
            cursor.setPosition(pos.posX, codeline.node.offsetTop + pos.posY);
            // lineBox.columnIndex = pos.charIndex;
            scrollLineIntoView( codeline );
        };

        cursor.oninput = function (event, type) {
        var lineContent, activeLine = lineBox.activeLine;

            switch ( type || event.keyCode ) {
            case 8:  // Backspace
                lineBox.seek( -1 );
                lineBox.deletes("current");
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 9: // Tab
                lineContent = lineBox.insert( "current", "\t" );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 13: // Enter
                lineContent = lineBox.insert( "current", "\n" );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 35: // End
                lineBox.seek( activeLine.contentLength(), activeLine );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 36: // Home
                lineBox.seek( 0, activeLine );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 46: // Delete
                lineBox.deletes("current");
                break;

            case 37: // ArrowLeft
                lineBox.seek( -1 );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 39: // ArrowRight
                lineBox.seek( 1 );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 38: // ArrowUp
                lineBox.seekLine( -1 );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 40: // ArrowDown
                lineBox.seekLine( 1 );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "input":
                lineContent = lineBox.insert( "current", event.data );
                setLinePosition( lineBox, activeLine, lineBox.columnIndex, true );
                break;

            case "copy":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent() );
                break;

            case "cut":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent("remove") );
                break;

            case "paste":
                lineBox.insert("current", event.clipboardData.getData("text/plain") );
                setLinePosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;
            }
        };

    },

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
    },

    LineBox = mix("ol.codes", function (parentNode, cursor, codeMeasure, codeHighlight) {

    var mousedownInfo = {x:-1, y:-1},
        codesElement = this,
        _mix = this._mix,

        // handle mousemove event
        selectionHandler = function (event) {

            if (_mix.range == null) return;
        var lipre = locateLineContentElement(event.target, this);
            if (lipre == null) return;

        var lirect = lipre.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

        var range = _mix.range;
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
            codeHighlight.select( range, _mix.node );
        };

        _mix.inputController = new InputController(_mix, cursor, codeMeasure).cursorEventHandler;

        codesElement.addEventListener("mousedown", function (event) {
        var lipre = locateLineContentElement(event.target, this);
            if (lipre == null) return;

            onevent( codesElement, "mousemove", selectionHandler);

        var lirect = lipre.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

        var codesRect = codesElement.getBoundingClientRect();
            mousedownInfo.x = event.clientX - codesRect.left;
            mousedownInfo.y = event.clientY - codesRect.top;
            mousedownInfo.target = event.target;
            mousedownInfo.position = pos;
            mousedownInfo.rangeStartNode = lipre.firstChild || lipre;

            if (_mix.range) {
                _mix.range.detach();
                _mix.range = null;
            }
            _mix.range = document.createRange();
        });

        onevent( document, "mouseup", function (event) {
            // window.range = _mix.range;
            offevent( codesElement, "mousemove", selectionHandler);

        });

        // mouse locate
        onevent( codesElement, "mouseup", function (event) {
        var lipre = locateLineContentElement(event.target, this);
            if (lipre == null) return;

        var lirect = lipre.getBoundingClientRect(),
            rect = codesElement.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            cursor.setPosition( pos.posX, lirect.top - rect.top + pos.posY );
            _mix.activeLine = lipre.parentNode._mix;
            _mix.columnIndex = pos.charIndex;
        });

    }, {
        setCode: function (src) {
        var start = 0, lastIdx, linenumber = 1,
            eOl = this.node;
        
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
        },

        getSelectedContent: function (removeContent) {

        var range = this.range,
            startLine, endLine, contents = [];

            if (range.collapsed) return "";

            startLine = locateLine(range.startContainer, this.node);
            endLine = locateLine(range.endContainer, this.node);

            if (startLine === endLine)
                return startLine.content().substring(range.startOffset, range.endOffset);

            contents.push( startLine.content().substring(range.startOffset) );
            startLine = startLine.node.nextElementSibling._mix;

            while (startLine != endLine) {
                contents.push( startLine.content() );
                startLine = startLine.node.nextElementSibling._mix;
            }

            contents.push( endLine.content().substring(0, range.endOffset) );

            return contents.join("\r\n");
        },

        seek: function (diff, codeLine) {
        var line = codeLine || this.activeLine,
            len = line.contentLength(),
            nextline,
            offset = codeLine == null ? (this.columnIndex + diff) : (diff);

            if (offset < 0) {
                nextline = line.previousLine();
                if (nextline == null)
                    this.seek( 0, line);
                else
                    this.seek( nextline.contentLength() + offset + 1, nextline );

            } else if (offset > len) {
                nextline = line.nextLine();
                if (nextline == null)
                    this.seek( line.contentLength(), line );
                else
                    this.seek( offset - len - 1, nextline );

            } else {
                this.columnIndex = offset;
                this.activeLine = line;
            }
        },

        /* diff: positive- next n line; negtive- previous n line. */
        seekLine: function (diff, codeLine) {
        var line = codeLine || this.activeLine,
            len;

            if (diff === 0) {
                this.activeLine = line;
                len = line.contentLength();
                if (this.columnIndex > len ) this.columnIndex = len;

            } else if (diff > 0) {
                this.seekLine( 0, line.nextLine(diff, true) );

            } else /* diff < 0 */ {
                this.seekLine( 0, line.previousLine( -diff, true ) );
            }
        },

        insert: function (position, content) {
        var lineBox = this,
            match, tailContent,
            activeLine = this.activeLine,
            regx = /(?:\r\n)|[\r\n]|(.+)/g;

            tailContent = activeLine.cut( this.columnIndex );
            while ( match = regx.exec( content ) ) {
                if (match[1]) {
                    activeLine.append( match[1] );
                } else {
                    activeLine = new CodeLine()._mix;
                    this.activeLine.node.parentNode.insertBefore(
                        activeLine.node,
                        this.activeLine.node.nextElementSibling);
                    this.activeLine = activeLine;
                }
            }

            this.columnIndex = activeLine.contentLength();
            if (tailContent) activeLine.append( tailContent );

        },

        deletes: function (position) {
        var activeLine = this.activeLine,
            lineContent,
            lineBox = this;

            switch (position) {
            case "current":
                if (lineBox.columnIndex === activeLine.contentLength()) {
                    if ( activeLine.node.nextElementSibling ) {
                        activeLine = activeLine.node.nextElementSibling._mix;
                        lineBox.activeLine.append( activeLine.content() );
                        activeLine.node.parentNode.removeChild( activeLine.node );
                    } else break;
                } else {
                    lineContent = activeLine.deleteChar( lineBox.columnIndex );
                }
                break;

            }
        }
    });

