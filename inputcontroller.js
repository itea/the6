/*  InputController use to controll user input events */
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
        };

        // range, save the range of user selected text
        this.range = document.createRange();

    var mousedownInfo = {x:-1, y:-1},
        controller = this,
        codesElement = lineBox.node,
        lastPos = {posX: -1, posY: -1},
        lastlipre,

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

        isRangeStartOrEnd = function (line, pos) {
        var x = 0,
            node = line.node.querySelector("pre");

            if (node.firstChild) node = node.firstChild;
            if (node == controller.range.startContainer && pos === controller.range.startOffset) x |= 1;
            if (node == controller.range.endContainer && pos === controller.range.endOffset) x |= 2;
            
            return x;
        },

        outOfBoxSelection = function (event) {
        var x = event.clientX,
            y = event.clientY,
            view = codebox.viewDimension;
        },

        // handle mousemove event
        mousemoveHandler = function (event) {

        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) { // curosr out of the lineBox
                return;
            }
        var line = locateLine(event.target, codesElement);

        var lirect = lipre.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            // reduce ineffectvie position setting
            if (pos.posX === lastPos.posX && pos.posY === lastPos.posY && lastlipre === lipre) return;
            lastPos = pos;
            lastlipre = lipre;

        var range = controller.range;
            /*
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
            */
            // range.setStart( mousedownInfo.rangeStartNode, mousedownInfo.position.charIndex );
            mousedownInfo.line.setRange(range, mousedownInfo.position.charIndex, true);
            range.collapse(true);
            setRange(range, line, pos.charIndex);
            codeHighlight.select( range, codesElement );

            bye(event, true);
        };

        if (browser === "FF")
        codesElement.addEventListener("mousedown", function (event) {
            if (event.button === 2) {
            log("mousedown");
            // FF browser need process before contextmenu because it triger contextmenu after contextmenu event
            var rect = codesElement.getBoundingClientRect();
            var cleaning = cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, !(controller.range || {collapsed: true}).collapsed, true);
            var delay = function () {
                    defer(cleaning, 200);
                    offevent(document, "mouseup", delay);
                    return;
                };

                onevent(document, "mouseup", delay);
            }
        });

        codesElement.addEventListener("mousedown", function (event) {
            cursor.reset();
            if (event.button !== 0) return; // Left button only

        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) return;
        var line = locateLine(event.target, codesElement);

            onevent( document, "mousemove", mousemoveHandler);

        var lirect = lipre.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

        var codesRect = codesElement.getBoundingClientRect();
            mousedownInfo.x = event.clientX - codesRect.left;
            mousedownInfo.y = event.clientY - codesRect.top;
            mousedownInfo.target = event.target;
            mousedownInfo.position = pos;
            // mousedownInfo.rangeStartNode = lipre.firstChild || lipre;
            mousedownInfo.line = line;

            if (controller.range) {
                controller.range.detach();
                controller.range = null;
                codeHighlight.clearSelection();
            }
            controller.range = document.createRange();
            // controller.range.setStart( mousedownInfo.rangeStartNode, pos.charIndex );
            line.setRange(controller.range, pos.charIndex, true);

            bye(event, true); // prevent cursor blur
        });

        onevent( document, "mouseup", function (event) {
            offevent( document, "mousemove", mousemoveHandler);
        });

        // cusror locate
        onevent( codesElement, "mouseup", function (event) {
            // if (event.button !== 0) return; // Left button only
        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) return;

        var lirect = lipre.getBoundingClientRect(),
            rect = codesElement.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            cursor.setPosition( pos.posX, lirect.top - rect.top + pos.posY );
            lineBox.activeLine = lipre.parentNode._mix;
            lineBox.columnIndex = pos.charIndex;
        });

        if (browser !== "FF")
        onevent( codesElement, "contextmenu", function (event) {
        var lipre = locateLineContentElement(event.target, codesElement), rect;
            if (lipre == null) return;

            rect = codesElement.getBoundingClientRect();
            cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, !(controller.range || {collapsed: true}).collapsed);
        });

        cursor.oninput = buildsteps(
        function (event, type) {
            type && log(type);
            // check textarea size
            lineBox.checkDimensionSize();
            return [event, type];
        },
        function (event, type) {
            // handle selection using keyboard
            if (!event.shiftKey) return [event, type];
            if (event.keyCode >40 || event.keyCode <35) return [event, type];

            // begin
        var x = 0, // x == 1: cursor is start node, x == 2: cursor is end node, x == 3: collapsed
            setRangePoint = [undefined, setRangeStart, setRangeEnd],
            range = controller.range,
            actLine;

            if (range.collapsed) {
                setRangeStart(range, lineBox.activeLine, lineBox.columnIndex);
                range.collapse(true);
            }
            x = isRangeStartOrEnd(lineBox.activeLine, lineBox.columnIndex);

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
            codeHighlight.select( controller.range, codesElement );
            return false;
        },
        function (event, type) {
            // process selection
            if ( controller.range.collapsed ) return [event, type];

            switch ( type || event.keyCode ) {
            case 8:  // Backspace
            case 46: // Delete
            case 13: // Enter
            case "delete":
                lineBox.deletes( controller.range );
                break;

            case "copy":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent(controller.range) );
                // skip clearSelection
                return false;

            case "cut":
                event.clipboardData.setData( "text/plain", lineBox.getSelectedContent(controller.range) );
                lineBox.deletes( controller.range );
                break;

            case "paste":
                lineBox.insert( controller.range, event.clipboardData.getData("text/plain") );
                break;

            case "contextmenu":
                rect = codesElement.getBoundingClientRect();
                cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, true);
                // skip clearSelection
                return false;

            case "input":
                lineBox.deletes( controller.range );
                // continue to default

            default:
                codeHighlight.clearSelection();
                controller.range.collapse(false);
                return [event, type];
            }

            codeHighlight.clearSelection();
            // before FF 25.0 first argument of collapse is mandatory
            controller.range.collapse(false);
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
        var activeLine = lineBox.activeLine, rect;

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
                lineBox.insert( "char", event.data );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "paste":
                lineBox.insert("char", event.clipboardData.getData("text/plain") );
                showCursorPosition( lineBox, lineBox.activeLine, lineBox.columnIndex, true );
                break;

            case "selectall": // select all
            var line = lineBox.node.firstElementChild._mix;
                line.setRange(controller.range, 0, true);
                line = lineBox.node.lastElementChild._mix;
                line.setRange(controller.range, -1);
                codeHighlight.select( controller.range, codesElement );
                break;
                /*
            var node = lineBox.node.firstElementChild.querySelector("pre");
                controller.range.setStart(node.firstChild || node, 0);
                node = lineBox.node.lastElementChild.querySelector("pre");
                if (node.lastChild) node = node.lastChild;
                controller.range.setEnd(node, node.length || 0);
                codeHighlight.select( controller.range, codesElement );
                break;
                */

            case "contextmenu":
                rect = codesElement.getBoundingClientRect();
                cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, false);
                break;
            }
        } );

    };

