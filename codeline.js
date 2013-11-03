var lineIDseq = 100,

    CodeLine = mix("li\n div.nu\n pre", function (content) {
        // this._mix.lineID = "L" + lineIDseq++;
        // if (this.dataset) this.dataset.lineId = this._mix.lineID;
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

        content: function () {
        var node = this.ePre;
            return getText(node);
        },

        contentLength: function () {
            return this.content().length;
        },

        insert: function (column, str) {
        var element = this.ePre,
            origin = getText(element);
            return setText( element, origin.substring(0, column) + str + origin.substring(column) );
        },

        append: function (str) {
        var element = this.ePre,
            origin = getText(element);
            return setText( element, origin + str );
        },

        deleteChar: function (column) {
        var element = this.ePre,
            origin = getText(element);
            if (column < 0 || column >= origin.length) return origin;
            return setText( element, origin.substring(0, column) + origin.substring(column +1) );
        },

        split: function (column) {
        var element = this.ePre,
            origin = getText(element);
            setText( element, origin.substring(0, column) );
            return new CodeLine( origin.substring(column) );
        },

        cut: function (column, backward) {
        var element = this.ePre,
            origin = getText(element);

            if (backward) {
                setText( element, origin.substring(column) );
                return origin.substring(0, column);
            } else {
                setText( element, origin.substring(0, column) );
                return origin.substring(column);
            }
        }
    });

