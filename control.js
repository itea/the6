var bindControl = function (codeBox, lineBox, cursor, codeMeasure, codeHighlight, vscrollbar, hscrollbar) {

    var lastLineID = -1,

        locatePreLine = function (node, topNode) {
            while (node && node != topNode) {
                if (node.tagName === "PRE") return node.parentNode._mix;
                node = node.parentNode;
            }
            return null;
        },

        // range, save the range of user selected text
        range = document.createRange();

        showCursorPosition = function (lineBox, codeline, columnIndex, forceSetLine) {
        var pos;
            if (lastLineID !== codeline.lineID || forceSetLine) {
                codeMeasure.setLine( codeline.content() );
                lastLineID = codeline.lineID;
            }
            pos = codeMeasure.measureByColumn( columnIndex );
            cursor.setPosition(pos.posX, codeline.node.offsetTop + pos.posY);
        };

    var codesElement = lineBox.node,

        setRangeStart = function (range, line, pos) {
            line.setRange(range, pos, true);
        },

        setRangeEnd = function (range, line, pos) {
            line.setRange(range, pos);
        },

        setRange = function (range, line, pos) {
        var container = range.startContainer,
            offset = range.startOffset;

            setRangeEnd(range, line, pos);
            if (range.collapsed) range.setEnd(container, offset);
        },

        isRangeStartOrEnd = function (range, line, pos) {
        var x = 0, node = line.ePre;

            if (node.firstChild != null) node = node.firstChild;
            if (node == range.startContainer && pos === range.startOffset) x |= 1;
            if (node == range.endContainer && pos === range.endOffset) x |= 2;
            
            return x;
        },

        // handle mousemove event
        mousemoveHandler = function (event) {
        var line = locatePreLine(event.target, codesElement);
            if (line) return void selection.fire("selection-mousemove", event, line); // curosr in the lineBox

            // when cursor out of box, scroll content and select
        var x = event.clientX, y = event.clientY,
            rect = codeBox.node.getBoundingClientRect(),
            view = codeBox.viewDimension, z = 0;

            // need to deal when pointer in number bar
            if (y < rect.top + view.top) z |= 1;
            if (y > rect.bottom - view.bottom) z |= 4;
            if (x < rect.left + view.left) z |= 8;
            if (x > rect.right - view.right) z |= 2;

            selection.fire("selection-outofboxmove", z);
        };

    var selection = new Emiter({});
        onevent([
        selection, "selection-mousedown", function (state, event, line) {
        var lirect = line.ePre.getBoundingClientRect(),
            pos = codeMeasure.measure( line.content(), event.clientX - lirect.left, event.clientY - lirect.top);

        var codesRect = codesElement.getBoundingClientRect();
            state.x = event.clientX - codesRect.left;
            state.y = event.clientY - codesRect.top;
            state.target = event.target;
            state.position = pos;
            state.line = line;

            if (range) {
                range.detach();
                range = null;
                codeHighlight.clearSelection();
            }
            range = document.createRange();
            line.setRange(range, pos.charIndex, true);
        },

        selection, "selection-mousemove", combine(
        (function () {
        var x = y = -1, _line;
            // reduce ineffectvie position setting
            return function (state, event, line) {
            var rect = line.ePre.getBoundingClientRect(),
                pos = codeMeasure.measure( line.content(), event.clientX - rect.left, event.clientY - rect.top);
                if (pos.posX === x && pos.posY === y && line === _line) return;

                x = pos.posX, y = pos.posY, _line = line;

                // clear interval for outofboxmove
                if (state.interval) {
                    window.clearInterval(state.interval);
                    delete state.interval;
                }
                return [state, line, pos, range];
            };
        }()),
        function (state, line, pos, range) {
            state.line.setRange(range, state.position.charIndex, true);
            range.collapse(true);
            setRange(range, line, pos.charIndex);
            codeHighlight.select( range, codesElement );
        }),

        selection, "selection-outofboxmove", function (state, z) {
            state.z = z;
            if (!state.interval) {
            var lineHeight = codeMeasure.getLineHeight(); 
                state.interval = window.setInterval(function () {
                var z = state.z;
                    if (z&1) {
                        vscrollbar.scrollBy(-lineHeight);
                        lineBox.seekLine(-1);
                        lineBox.activeLine.setRange(range, lineBox.columnIndex);
                        codeHighlight.select( range, codesElement );
                    }
                    if (z&4) {
                        vscrollbar.scrollBy(lineHeight);
                        lineBox.seekLine(1);
                        lineBox.activeLine.setRange(range, lineBox.columnIndex);
                        codeHighlight.select( range, codesElement );
                    }
                    if (z&2) {
                        hscrollbar.scrollBy(20);
                    }
                    if (z&8) hscrollbar.scrollBy(-20);
                }, 200);

                onevent(document, "mouseup", function cleaning(event) {
                    offevent(document, "mouseup", cleaning);
                    if (state.interval) {
                        window.clearInterval(state.interval);
                        delete state.interval;
                    }
                });
            }
        }
        ]);

    var handlers = [
        codesElement, "mousedown", function (event) {
            cursor.reset();
            if (event.button !== 0) return; // Left button only

        var line = locatePreLine(event.target, codesElement);
            if (line == null) return;

        var lirect = line.ePre.getBoundingClientRect(),
            pos = codeMeasure.measure(line.content(), event.clientX - lirect.left, event.clientY - lirect.top);
            cursor.setPosition(pos.posX, line.node.offsetTop + pos.posY);
            lineBox.activeLine = line;
            lineBox.columnIndex = pos.charIndex;

            selection.fire("selection-mousedown", event, line);

            onevent( document, "mousemove", mousemoveHandler);

            bye(event, true); // prevent cursor blur
        },

        document, "mouseup", function (event) {
            offevent( document, "mousemove", mousemoveHandler);
            // selection.fire("selection-mouseup", event);
        },

        // cusror locate
        codesElement, "mouseup", function (event) {
            // if (event.button !== 0) return; // Left button only
        var line = locatePreLine(event.target, codesElement);
            if (line == null) return;

        var lirect = line.ePre.getBoundingClientRect(),
            pos = codeMeasure.measure(line.content(), event.clientX - lirect.left, event.clientY - lirect.top);
            cursor.setPosition(pos.posX, line.node.offsetTop + pos.posY);
            lineBox.activeLine = line;
            lineBox.columnIndex = pos.charIndex;
        },

        "keyboard-input", combine(
        function (event, type) {
            // check textarea size
            lineBox.checkDimensionSize();
            return true;
        },
        function (event, type) {
            if (!event.shiftKey || event.keyCode >40 || event.keyCode <35) return true;

            // handle selection using keyboard
        var x = 0, // x == 1: cursor is start node, x == 2: cursor is end node, x == 3: collapsed
            setRangePoint = [undefined, setRangeStart, setRangeEnd],
            actLine;

            if (range.collapsed) {
                setRangeStart(range, lineBox.activeLine, lineBox.columnIndex);
                range.collapse(true);
            }
            x = isRangeStartOrEnd(range, lineBox.activeLine, lineBox.columnIndex);

            switch (type || event.keyCode) {
            case 35: // End
                lineBox.seek( lineBox.activeLine.contentLength(), lineBox.activeLine );
                if (range.commonAncestorContainer == lineBox.node) // not same line
                    setRangePoint[2&x || 1&x](range, lineBox.activeLine, lineBox.columnIndex);
                else {
                    if (1&x) range.collapse(false);
                    setRangeEnd(range, lineBox.activeLine, lineBox.columnIndex);
                }
                break;
            case 36: // Home
                lineBox.seek( 0, lineBox.activeLine );
                if (range.commonAncestorContainer == lineBox.node) // not same line
                    setRangePoint[1&x || 2&x](range, lineBox.activeLine, lineBox.columnIndex);
                else {
                    if (2&x) range.collapse(true);
                    setRangeStart(range, lineBox.activeLine, lineBox.columnIndex);
                }
                break;
            case 37: // ArrowLeft
                lineBox.seek( -1 );
                setRangePoint[1&x || 2&x](range, lineBox.activeLine, lineBox.columnIndex);
                break;
            case 38: // ArrowUp
                lineBox.seekLine( -1 );
                range.collapse( 2&x );
                setRange(range, lineBox.activeLine, lineBox.columnIndex);
                break;
            case 39: // ArrowRight
                lineBox.seek( 1 );
                setRangePoint[2&x || 1&x](range, lineBox.activeLine, lineBox.columnIndex);
                break;
            case 40: // ArrowDown
                lineBox.seekLine( 1 );
                range.collapse( 2&x );
                setRange(range, lineBox.activeLine, lineBox.columnIndex);
                break;
            default:
                return [event, type];
            }
            showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
            codeHighlight.select( range, codesElement );
            return false;
        },
        function (event, type) {
        var modified;
            // process selection
            if ( range.collapsed ) return true;

            switch ( type || event.keyCode ) {
            case 8:  // Backspace
            case 46: // Delete
            case 13: // Enter
            case "delete":
                lineBox.deletes( range );
                break;

            case "copy":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent(range) );
                // skip clearSelection
                return false;

            case "cut":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent(range) );
                lineBox.deletes( range );
                break;

            case "paste":
                lineBox.deletes( range );
                modified = lineBox.insert( event.clipboardData.getData("text/plain") );
                log(modified);
                break;

            case "contextmenu":
                rect = codesElement.getBoundingClientRect();
                cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, true);
                // skip clearSelection
                return false;

            case "input":
                lineBox.deletes( range );
                // continue to default

            default:
                codeHighlight.clearSelection();
                range.collapse(false);
                return [event, type];
            }

            codeHighlight.clearSelection();
            // before FF 25.0 first argument of collapse is mandatory
            range.collapse(false);
            showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
            return false;
        },

        function (event, type) {
            // pre process
            switch ( type || event.keyCode ) {
            case 9:  // Tab
                event.data = "\t";
                type = "input";
                break;

            case 13: // Enter
                event.data = "\n";
                type = "input";
                break;
            }

            return [event, type];
        },

        function (event, type) {
        var activeLine = lineBox.activeLine, rect, modified;

            switch ( type || event.keyCode ) {
            case 8:  // Backspace
                if ( 0 === lineBox.seek( -1 ) ) lineBox.deletes("char");
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 35: // End
                lineBox.seek( activeLine.contentLength(), activeLine );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 36: // Home
                lineBox.seek( 0, activeLine );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 46: // Delete
                lineBox.deletes("char");
                break;

            case 37: // ArrowLeft
                lineBox.seek( -1 );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 39: // ArrowRight
                lineBox.seek( 1 );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 38: // ArrowUp
                lineBox.seekLine( -1 );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case 40: // ArrowDown
                lineBox.seekLine( 1 );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "input":
                modified = lineBox.insert( event.data );
                log(modified);
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "paste":
                modified = lineBox.insert(event.clipboardData.getData("text/plain") );
                log(modified);
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "selectall": // select all
            var line = lineBox.node.firstElementChild._mix;
                line.setRange(range, 0, true);
                line = lineBox.node.lastElementChild._mix;
                line.setRange(range, -1);
                codeHighlight.select( range, codesElement );
                break;

            case "contextmenu":
                rect = codesElement.getBoundingClientRect();
                cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, false);
                break;
            }
        })
        ];

        if (browser !== "FF") handlers.push(
        codesElement, "contextmenu", function (event) {
        var line = locatePreLine(event.target, codesElement);
            if (line == null) return;

            rect = codesElement.getBoundingClientRect();
            cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, !(range || {collapsed: true}).collapsed);
        });

        if (browser === "FF") handlers.push(
        codesElement, "mousedown", function (event) {
            if (event.button === 2) {
            // FF browser need process before contextmenu because it triger contextmenu after contextmenu event
            var rect = codesElement.getBoundingClientRect();
            var cleaning = cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, !(range || {collapsed: true}).collapsed, true);
            var delay = function () {
                    defer(cleaning, 200);
                    offevent(document, "mouseup", delay);
                    return;
                };

                onevent(document, "mouseup", delay);
            }
        });

        onevent(handlers);

        // to unbind event handlers, use:
        return function () { offevent(handlers); };
    };

