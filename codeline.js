    var CodeLine = mix("li > pre", function (content, charidx, linenumber) {
        setText( this.children[0], content );
        this.insertBefore( markless("div.nu"), this.children[0] );
        this._mix.ePre = this.querySelector("pre");
    }, {
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
            return new CodeLine( origin.substring(column), 0, 0 );
        }
    });

