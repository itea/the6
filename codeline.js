var lineIDseq = 100,

    CodeLine = mix("li\n div.nu\n pre", function (content) {
        this._mix.lineID = lineIDseq++;
        if (this.dataset) this.dataset.lineId = this._mix.lineID;
        this._mix.ePre = this.querySelector("pre");
        if (content) setText( this._mix.ePre, content );
    }, {
        /* previous n lines, n default is 1 */
        previousLine: function (n, flg) {
        var p, node = this.node;

            n = n || 1;
            while (n-- > 0) {
                p = node.previousElementSibling;
                if (p == null) {
                    if (flg === true) break;
                    else return null;
                }
                node = p;
            }
            return node._mix;
        },

        /* next n lines, n default is 1 */
        nextLine: function (n, flg) {
        var p, node = this.node;

            n = n || 1;
            while (n-- > 0) {
                p = node.nextElementSibling;
                if (p == null) {
                    if (flg === true) break;
                    else return null;
                }
                node = p;
            }
            return node._mix;
        },

        /* if passed start/end, then return substring of content. */
        content: function (start, end) {
        var node = this.ePre,
            text = getText(node);

            if (typeof start === "number") {
                if (typeof end === "number")
                    return text.substring(start, end);
                else
                    return text.substring(start);
            } else
                return text;
        },

        contentLength: function () {
            return this.content().length;
        },

        insert: function (start, str) {
        var element = this.ePre,
            origin = getText(element);
            return setText( element, origin.substring(0, start) + str + origin.substring(start) );
        },

        append: function (str) {
        var element = this.ePre,
            origin = getText(element);
            return setText( element, origin + str );
        },

        deletes: function (start, end) {
        var element = this.ePre,
            text,
            origin = getText(element);
            if (start < 0 || start > origin.length) return "";

            if (typeof end === "number") {
                setText( element, origin.substring(0, start) + origin.substring(end) );
                text = origin.substring( start, end );
            } else {
                setText( element, origin.substring(0, start) );
                text = origin.substring(start);
            }
            return text;
        }
    });

