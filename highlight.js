var createMask = function (top, left, height, width) {
    // TODO use HTML string instead of createElement
        var e = document.createElement("div");
        e.className = "selected";
        e.style.top = top + "px";
        e.style.left = left + "px";
        e.style.height = height + "px";
        e.style.width = width + "px";
        return e;
    },
    
    // TODO 
    CodeHighlight = mix("div.code-highlight", {
        setBaseOffset: function (x, y) {
            this.baseX = x;
            this.baseY = y;
        },
        clearSelection: function () {
            this.node.innerHTML = "";
        },
        select: function (range, scrollTop, scrollLeft) {
            this.clearSelection();
            var rects = range.getClientRects(), len = rects.length, rect, rectLast, e, bRect, bulkHeigt = 0;
            if (len === 1) {
                rect = rects[0];
                e = createMask(rect.top - this.baseY + (scrollTop || 0),
                    rect.left - this.baseX + (scrollLeft || 0),
                    rect.height,
                    rect.width);
                this.node.appendChild(e);
            } else {
                bRect = range.getBoundingClientRect();
                rect = rects[0];
                this.node.appendChild( createMask( rect.top - this.baseY + (scrollTop || 0),
                    rect.left - this.baseX + (scrollLeft || 0),
                    rect.height, bRect.width - rect.left + bRect.left) );
                
                bulkHeight = bRect.height - rect.height;

                rectLast = rects[ len -1 ];
                this.node.appendChild( createMask( rectLast.top - this.baseY + (scrollTop || 0),
                    rectLast.left - this.baseX + (scrollLeft || 0),
                    rectLast.height, rectLast.width) );

                bulkHeight = rectLast.top - rect.height - rect.top;
                if (bulkHeight <=0) return;

                this.node.appendChild( createMask( rect.top + rect.height - this.baseY + (scrollTop || 0),
                    rectLast.left - this.baseX + (scrollLeft || 0),
                    bulkHeight, bRect.right - rectLast.left) );
            }
        }
    });

