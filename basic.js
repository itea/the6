var mix = markless.mix,

    noop = function () {},
    
    browser = (function () {
        var userAgent = window.navigator.userAgent;
        if (window.opera) return "OPERA";
        if (userAgent.indexOf("Chrome/") > 0) return "CHROME";
        if (userAgent.indexOf("Firefox/") > 0) return "FF";
        return "UNKNOWN";
    })(),

    defer = function (cbk) {
        window.setTimeout(cbk, 0);
    },

    buildsteps = function () {
    var len = arguments.length, i = 0,
        fns = [];

        for (; i < len; i++) {
            fns.push( arguments[i] );
        }

        return function () {
        var len = arguments.length, i = 0,
            result = [];

            for (; i < len; i++) {
                result.push (arguments[i]);
            }

            for (i = 0, len = fns.length; i < len; i++) {
                result = fns[i].apply(this, result);
                if ( !result ) break;
            }

            return result;
        };
    },

    setText = function (node, text) {
        if (typeof node.innerText === "string")
            node.innerText = text;
        else // Firefox
            node.textContent = text;
    },

    getText = function (node) {
        return node.innerText || node.textContent;
    },

    onevent = function (node, eventTypes, callback, capture) {
        // TODO
        node.addEventListener(eventTypes, callback, capture);
    },

    offevent = function (node, eventTypes, callback) {
        // TODO
        node.removeEventListener(eventTypes, callback);
    },

    scrollLineIntoView = function (codeline) {
        var node = codeline.node, boxNode,
            lineOffsetTop, boxScrollTop, boxClientHeight, lineOffsetHeight;
        if (node.scrollIntoViewIfNeeded) node.scrollIntoViewIfNeeded(false);
        else { // Browser that doesnt support scrollIntoViewIfNeeded()
            boxNode = node.parentNode.parentNode;
            lineOffsetTop = node.offsetTop;
            lineOffsetHeight = node.offsetHeight;
            boxScrollTop = boxNode.scrollTop;
            boxClientHeight = boxNode.clientHeight;

            if (boxScrollTop - lineOffsetTop > 0)
                boxNode.scrollTop = lineOffsetTop;
            else if (lineOffsetTop - boxClientHeight - boxScrollTop + lineOffsetHeight > 0)
                boxNode.scrollTop = lineOffsetTop + lineOffsetHeight - boxClientHeight;
        }
    };

