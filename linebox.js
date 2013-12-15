var locateLine = function (node, topNode) {
    // find up to locate the CodeLine
        while (node != topNode) {
            if (node._mix) return node._mix;
            node = node.parentNode;
        }
        return null;
    },

    locateLineContentElement = function (lipre, topNode) {
        while (lipre && lipre != topNode) {
            if (lipre.tagName === "PRE") return lipre;
            lipre = lipre.parentNode;
        }
        return null;
    },

    LineBox = mix("ol.codes", function () {
    var _mix = this._mix,
        node = this;

        _mix.nuCssRule = (function () {
            document.styleSheets[0].insertRule("ol.codes div.nu {}", document.styleSheets[0].cssRules.length);
            return document.styleSheets[0].cssRules[ document.styleSheets[0].cssRules.length -1 ];
        }());

        _mix.preCssRule = (function () {
            document.styleSheets[0].insertRule("ol.codes pre {}", document.styleSheets[0].cssRules.length);
            return document.styleSheets[0].cssRules[ document.styleSheets[0].cssRules.length -1 ];
        }());

        onevent("horizontal-scroll", function (offset) {
            _mix.nuCssRule.style.left = offset -node.offsetLeft + "px";
        },
        "option-wrapLine", function (flag) {
            _mix.checkDimensionSize();
            _mix.preCssRule.style.cssText = !!flag ? "white-space: pre-wrap;" : "white-space: pre";
        });

        // onevent("vertical-scroll", function (offset) { });

        onevent("view-resize", function (viewDimension) {
            node.style.minWidth = viewDimension.width + "px";
        });
    }, {
        checkDimensionSize: function () {
        var node = this.node,
            oldWidth = node.clientWidth,
            oldHeight = node.clientHeight;

            defer(function () {
            var width = node.clientWidth,
                height = node.clientHeight,
                // x == 1, width changed; x == 2, height changed; x == 3, both changed
                x = (oldWidth === width ? 0 : 1) | (oldHeight === height ? 0: 2);

                if (x) emit.fire("textarea-resize", width, height, x);
            });
        },

        setCode: function (src) {
        var start = 0, lastIdx, linenumber = 1,
            node = this.node;

            while (true) {
                // TODO use reguler expression /\r\n?|\n/g to find index of lineTeminator
                lastIdx = src.indexOf("\n", start);
                if (lastIdx == -1) lastIdx = src.length;
                
                node.appendChild(
                    new CodeLine( src.substring(start, lastIdx), start, linenumber )
                    );
        
                start = lastIdx +1;
                linenumber ++;
                if (start > src.length) break;
            }
            this.activeLine = this.node.querySelector("li")._mix;
            this.columnIndex = 0;

            this.checkDimensionSize();
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
                    return this.seek( nextline.contentLength() + offset + 1, nextline );

            } else if (offset > len) {
                nextline = line.nextLine();
                if (nextline == null) {
                    this.seek( len, line );
                    return offset - len;
                } else
                    return this.seek( offset - len - 1, nextline );

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

        insert: function (content) {
        var lineBox = this,
            match, tailContent, range,
            activeLine = this.activeLine,
            modified = [],
            regx = /(?:\r\n)|[\r\n]|(.+)/g;

            tailContent = activeLine.deletes( this.columnIndex );
            modified.push(activeLine);
            while ( match = regx.exec( content ) ) {
                if (match[1]) {
                    activeLine.append( match[1] );
                } else {
                    activeLine = new CodeLine()._mix;
                    this.activeLine.node.parentNode.insertBefore(
                        activeLine.node,
                        this.activeLine.node.nextElementSibling);
                    this.activeLine = activeLine;
                    modified.push(activeLine);
                }
            }

            this.columnIndex = activeLine.contentLength();
            if (tailContent) activeLine.append( tailContent );
            return modified;
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

