var mix = markless.mix,
    
    browser = (function () {
        var userAgent = window.navigator.userAgent;
        if (window.opera) return "OPERA";
        if (userAgent.indexOf("Chrome/") > 0) return "CHROME";
        if (userAgent.indexOf("Firefox/") > 0) return "FF";
        return "UNKNOWN";
    })(),

    setText = function (node, text) {
        if (typeof node.innerText === "string")
            node.innerText = text;
        else // Firefox
            node.textContent = text;
    },

    getText = function (node) {
        return node.innerText || node.textContent;
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

