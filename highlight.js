var setSelectionRect = function (node, t, l, h, w, show) {
    var style = node.style;
        if (t === "hide")
            style.display = "none";
        // else if (t === "show")
        //     style.display = "block";
        else {
            style.top = t + "px";
            style.left = l + "px";
            style.height = h + "px";
            style.width = w + "px";
            if (show) style.display = "block";
        }
    }
    
    CodeHighlight = mix("div.code-highlight\n div.selected\n div.selected\n div.selected", function () {
        this._mix.selectionMaskers = [ this.children[0], this.children[1], this.children[2] ];
    }, {
        setBaseOffset: function (x, y) {
            this.baseX = x;
            this.baseY = y;
        },
        clearSelection: function () {
            setSelectionRect( this.selectionMaskers[0], "hide");
            setSelectionRect( this.selectionMaskers[1], "hide");
            setSelectionRect( this.selectionMaskers[2], "hide");
        },
        select: function (range, lineBox) {
        var rects = range.getClientRects(), len = rects.length, rect, rectLast, e, bRect, bulkHeigt = 0,
            lineBoxRect = lineBox.getBoundingClientRect();

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

