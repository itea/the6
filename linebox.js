var locateLine = function (node, topNode) {
    // find up to locate the CodeLine
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
    var _mix = this._mix,
        thisNode = this;

        _mix.nuCssRule = (function () {
            document.styleSheets[0].insertRule(".codes div.nu {}", document.styleSheets[0].length);
            return document.styleSheets[0].cssRules[0];
        }());

        _mix.inputController = new InputController(_mix, cursor, codeMeasure, codeHighlight);
        cursor.inputController = this._mix.inputController;

        onevent("horizontal-scroll", function (event, offset) {
            thisNode.style.left = -offset + "px";
            _mix.nuCssRule.style.left = -thisNode.offsetLeft + "px";
        });

        onevent("vertical-scroll", function (event, offset) {
            thisNode.style.top = -offset + "px";
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
                if (nextline == null) {
                    this.seek( 0, line);
                    return offset;
                } else
                    this.seek( nextline.contentLength() + offset + 1, nextline );

            } else if (offset > len) {
                nextline = line.nextLine();
                if (nextline == null) {
                    this.seek( len, line );
                    return offset - len;
                } else
                    this.seek( offset - len - 1, nextline );

            } else {
                this.columnIndex = offset;
                this.activeLine = line;
                return 0;
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

