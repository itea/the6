var InputController = function (lineBox, cursor, codeMeasure, codeHighlight) {

    var lastLineID = -1,

        showCursorPosition = function (lineBox, codeline, columnIndex, forceSetLine) {
        var pos;
            if (lastLineID !== codeline.lineID || forceSetLine) {
                codeMeasure.setLine( codeline.content() );
                lastLineID = codeline.lineID;
            }
            pos = codeMeasure.measureByColumn( columnIndex );
            cursor.setPosition(pos.posX, codeline.node.offsetTop + pos.posY);
            scrollLineIntoView( codeline );
        };

    var mousedownInfo = {x:-1, y:-1},
        controller = this,
        codesElement = lineBox.node,

        // handle mousemove event
        selectionHandler = function (event) {

        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) return;

        var lirect = lipre.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

        var range = controller.range;
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
            codeHighlight.select( range, codesElement );
        };

        codesElement.addEventListener("mousedown", function (event) {
        var lipre = locateLineContentElement(event.target, codesElement);
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

            if (controller.range) {
                controller.range.detach();
                controller.range = null;
                codeHighlight.clearSelection();
            }
            controller.range = document.createRange();
            controller.range.setStart( mousedownInfo.rangeStartNode, pos.charIndex );
        });

        onevent( document, "mouseup", function (event) {
            offevent( codesElement, "mousemove", selectionHandler);

        });

        // mouse locate
        onevent( codesElement, "mouseup", function (event) {
        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) return;

        var lirect = lipre.getBoundingClientRect(),
            rect = codesElement.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            cursor.setPosition( pos.posX, lirect.top - rect.top + pos.posY );
            lineBox.activeLine = lipre.parentNode._mix;
            lineBox.columnIndex = pos.charIndex;
        });

        cursor.oninput = function (event, type) {
        var activeLine = lineBox.activeLine;

            switch ( type || event.keyCode ) {
            case 8:  // Backspace
                if ( ! controller.range.collapsed ) {
                    lineBox.deletes( controller.range );
                    codeHighlight.clearSelection();
                    controller.range.collapse();
                } else {
                    lineBox.seek( -1 );
                    lineBox.deletes("char");
                }
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 9: // Tab
                lineBox.insert( "char", "\t" );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 13: // Enter
                lineBox.insert( "char", "\n" );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 35: // End
                lineBox.seek( activeLine.contentLength(), activeLine );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 36: // Home
                lineBox.seek( 0, activeLine );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 46: // Delete
                if ( ! controller.range.collapsed ) {
                    lineBox.deletes( controller.range );
                    codeHighlight.clearSelection();
                    controller.range.collapse();
                    showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                } else
                    lineBox.deletes("char");
                break;

            case 37: // ArrowLeft
                lineBox.seek( -1 );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 39: // ArrowRight
                lineBox.seek( 1 );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 38: // ArrowUp
                lineBox.seekLine( -1 );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 40: // ArrowDown
                lineBox.seekLine( 1 );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "input":
                lineBox.insert( "char", event.data );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "copy":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent(controller.range) );
                break;

            case "cut":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent(controller.range) );
                lineBox.deletes( controller.range );
                codeHighlight.clearSelection();
                controller.range.collapse();
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "paste":
                if ( ! controller.range.collapsed ) {
                    lineBox.insert( controller.range, event.clipboardData.getData("text/plain") );
                    codeHighlight.clearSelection();
                    controller.range.collapse();
                } else {
                    lineBox.insert("char", event.clipboardData.getData("text/plain") );
                }
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
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
    var _mix = this._mix;

        _mix.inputController = new InputController(_mix, cursor, codeMeasure, codeHighlight);

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

        getSelectedContent: function (range) {

        var startLine, endLine, contents = [];

            if (range.collapsed) return "";

            startLine = locateLine(range.startContainer, this.node);
            endLine = locateLine(range.endContainer, this.node);

            if (startLine === endLine)
                return startLine.content(range.startOffset, range.endOffset);

            contents.push( startLine.content(range.startOffset) );
            startLine = startLine.nextLine();

            while (startLine != endLine) {
                contents.push( startLine.content() );
                startLine = startLine.nextLine();
            }

            contents.push( endLine.content(0, range.endOffset) );

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
            match, tailContent, range,
            activeLine = this.activeLine,
            regx = /(?:\r\n)|[\r\n]|(.+)/g;

            if (position instanceof Range) {
                range = position;
                position = "range";
            }

            switch (position) {
            case "range":
                this.deletes(range);

                // continue to insert content by reusing case "char"
                activeLine = this.activeLine;

            case "char":
                tailContent = activeLine.deletes( this.columnIndex );
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
                break;

            case "line":
                break;
            }
        },

        deletes: function (position) {
        var activeLine = this.activeLine,
            range,
            lineBox = this;

            if (position instanceof Range) {
                range = position;
                position = "range";
            }

            switch (position) {
            case "range":
            var startLine, line, endLine, lineNodes = [];

                if (range.collapsed) return "";

                startLine = locateLine(range.startContainer, this.node);
                endLine = locateLine(range.endContainer, this.node);

                lineBox.activeLine = startLine;
                lineBox.columnIndex = range.startOffset;

                if (startLine === endLine) {
                    startLine.deletes(range.startOffset, range.endOffset);
                    break;
                }

                startLine.deletes(range.startOffset);

                line = startLine.nextLine();

                // put nodes to lineNodes to be removed
                while (line != endLine) {
                    lineNodes.push( line.node );
                    line = line.nextLine();
                }
                lineNodes.push(endLine.node);

                startLine.append( endLine.content(range.endOffset) );

                while (line = lineNodes.pop() )
                    lineBox.node.removeChild( line );

                break;

            case "char":
                if (lineBox.columnIndex === activeLine.contentLength()) {
                    if ( activeLine.node.nextElementSibling ) {
                        activeLine = activeLine.node.nextElementSibling._mix;
                        lineBox.activeLine.append( activeLine.content() );
                        activeLine.node.parentNode.removeChild( activeLine.node );
                    } else break;
                } else {
                    activeLine.deletes( lineBox.columnIndex, lineBox.columnIndex +1 );
                }
                break;

            case "line":
                break;

            }
        }
    });

