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

        // handle mousemove event
        mousemoveHandler = function (event) {

        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) { // curosr out of the lineBox
                return;
            }

        var lirect = lipre.getBoundingClientRect(),
            pos = codeMeasure.measure( getText(lipre), event.clientX - lirect.left, event.clientY - lirect.top);

            // reduce ineffectvie position setting
            if (pos.posX === lastPos.posX && pos.posY === lastPos.posY && lastlipre === lipre) return;
            lastPos = pos;
            lastlipre = lipre;

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

            bye(event, true, true);
        };

        codesElement.addEventListener("mousedown", function (event) {
            if (event.button !== 0) return; // Left button only

        var lipre = locateLineContentElement(event.target, codesElement);
            if (lipre == null) return;

            // onevent( codesElement, "mousemove", mousemoveHandler);
            onevent( document, "mousemove", mousemoveHandler);

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

            bye(event, true);
        });

        onevent( document, "mouseup", function (event) {
            // offevent( codesElement, "mousemove", mousemoveHandler);
            offevent( document, "mousemove", mousemoveHandler);

        });

        // mouse locate
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

        onevent( codesElement, "contextmenu", function (event) {
        var lipre = locateLineContentElement(event.target, codesElement), rect;
            if (lipre == null) return;

            rect = codesElement.getBoundingClientRect();
            cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, !(controller.range || {collapsed: true}).collapsed);
        });

        cursor.oninput = buildsteps(
        function (event, type) {
            // check textarea size
            lineBox.checkDimensionSize();
            return [event, type];
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
                controller.range.collapse();
                return [event, type];
            }

            codeHighlight.clearSelection();
            controller.range.collapse();
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

            case "select": // select all
            var node = lineBox.node.firstElementChild.querySelector("pre");
                controller.range.setStart(node.firstChild || node, 0);
                node = lineBox.node.lastElementChild.querySelector("pre");
                if (node.lastChild) node = node.lastChild;
                controller.range.setEnd(node, node.length || 0);
                codeHighlight.select( controller.range, codesElement );
                break;

            case "contextmenu":
                rect = codesElement.getBoundingClientRect();
                cursor.beforeContextmenuPopup(event.clientX - rect.left, event.clientY - rect.top, false);
                break;
            }
        } );

    };

