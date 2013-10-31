    var Coder = function (src) {
        this.boxElement = new CodeBox();
        var _mix = this.boxElement._mix;
        window.setTimeout( function () {
            _mix.setCode(src);
        }, 0);
        //this.boxElement._mix.setCode(src);
    };

    var createCoderBox = function (src) {
        return new Coder(src);
    };

