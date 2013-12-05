var mixresult = function () {
        return {
            posX: arguments[0],
            posY: arguments[1],
            offsetX: arguments[2],
            offsetY: arguments[3],
            charIndex: arguments[4],
            width: arguments[5],
            content: arguments[6]
        };
    },

    CodeMeasure = mix("div.code-measure >pre", function () {
    var node = this,
        _mix = this._mix;

        _mix.wrapLine = false;

        onevent([
        "textarea-resize", function (width, height, x) {
            // node.style.width = width + "px";
        },
        "option-wrapline", function (flag) {
            _mix.wrapLine = flag = !!flag;
        }]);

    },{
        lineContent: {length: -1},

        setLine: function (line) {
            if (line.length === this.lineContent.length && line === this.lineContent)
                return this;

        var html = ["<span>"], i;

            for (i=0; i< line.length; i++ ) {
                html.push(line[i]);
                html.push("</span><span>");
            }
            html.push(" </span>");
            this.node.children[0].innerHTML = html.join("");
            return this;
        },

        measure: function (line, offx, offy) {
            if (typeof line === "string") this.setLine(line);
            else offy = offx, offx = line;

        var node = this.node,
            ele = node.children[0].children[0],
            charidx = 0;

            while ( (ele.offsetTop + ele.offsetHeight) < offy && ele.nextElementSibling) {
                ele = ele.nextElementSibling;
                charidx ++;
            }
            while (ele.offsetLeft <= offx && ele.nextElementSibling) {
                if ( ele.nextElementSibling.offsetLeft - Math.round(ele.offsetWidth/2) > offx) break;
                ele = ele.nextElementSibling;
                charidx ++;
            }
            return mixresult( ele.offsetLeft, ele.offsetTop, offx, offy, charidx, ele.offsetWidth, getText(ele) );
        },

        measureByColumn: function (line, charidx) {
            if (typeof line === "string") this.setLine(line);
            else charidx = line;

            if (charidx < 0) charidx = 0;
        var nodeList = this.node.children[0].children,
            ele = nodeList[charidx = charidx < nodeList.length ? charidx : (nodeList.length -1)];
            return mixresult( ele.offsetLeft, ele.offsetTop, ele.offsetLeft, ele.offsetTop, charidx, ele.offsetWidth, getText(ele) );
        }
    });
    
