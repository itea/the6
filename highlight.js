var setSelectionRect = function (node, t, l, h, w, show) {
    var style = node.style;
        if (t === "hide")
            style.display = "none";
        else {
            style.top = t + "px";
            style.left = l + "px";
            style.height = h + "px";
            style.width = w + "px";
            if (show) style.display = "block";
        }
    },

    clearSelection = function () {
        setSelectionRect( this.selectionMaskers[0], "hide");
        setSelectionRect( this.selectionMaskers[1], "hide");
        setSelectionRect( this.selectionMaskers[2], "hide");
        this.clearSelection = noop;
    },
    
    /*
    _CodeHighlight = combine(
        '<div class="code-highlight"><div class="selected"><div class="selected"><div class="selected"></div>',
        
        function (html) {
        var wrap = document.createElement("div");
            wrap.innerHTML = html;

            return [ wrap.firstElementChild ];
        },
        function (node) {
            return [ node, node._mix = {node: node} ];
        }
    },
    */

    CodeHighlight = mix("div.code-highlight\n div.selected\n div.selected\n div.selected", function () {
    var node = this;

        this._mix.selectionMaskers = [ this.children[0], this.children[1], this.children[2] ];

        onevent("textarea-resize", function (width, height, x) {
            if (x & 1) node.style.width = width + "px";
        });
    }, {
        setBaseOffset: function (x, y) {
            this.baseX = x;
            this.baseY = y;
        },

        clearSelection: clearSelection,

        select: function (range, lineBox) {
        var rects = range.getClientRects(), len = rects.length, rect, rectLast, e, bRect, bulkHeigt = 0,
            lineBoxRect = lineBox.getBoundingClientRect();

            this.clearSelection = clearSelection;

            if (len === 1) {
                rect = rects[0];
                setSelectionRect( this.selectionMaskers[1], "hide");
                setSelectionRect( this.selectionMaskers[2], "hide");
                setSelectionRect( this.selectionMaskers[0],
                    rect.top - this.baseY - lineBoxRect.top,
                    rect.left + this.baseX - lineBoxRect.left,
                    rect.height,
                    rect.width,
                    true);
            } else {
                bRect = range.getBoundingClientRect();
                rect = rects[0];
                setSelectionRect( this.selectionMaskers[0],
                    rect.top - this.baseY - lineBoxRect.top,
                    rect.left + this.baseX - lineBoxRect.left,
                    rect.height,
                    bRect.width - rect.left + bRect.left,
                    true);
                
                rectLast = rects[ len -1 ];
                setSelectionRect( this.selectionMaskers[2],
                    rectLast.top - this.baseY - lineBoxRect.top,
                    rectLast.left + this.baseX - lineBoxRect.left,
                    rectLast.height,
                    rectLast.width,
                    true);

                bulkHeight = rectLast.top - rect.height - rect.top;
                if (bulkHeight <= 0) return;

                setSelectionRect( this.selectionMaskers[1],
                    rect.top + rect.height - this.baseY - lineBoxRect.top,
                    rectLast.left + this.baseX - lineBoxRect.left,
                    bulkHeight,
                    bRect.right - rectLast.left,
                    true);
            }
        }
    });

