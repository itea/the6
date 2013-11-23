var mix = markless.mix,

    noop = function () {},
    
    browser = (function () {
        var userAgent = window.navigator.userAgent;
        if (window.opera) return "OPERA";
        if (userAgent.indexOf("Chrome/") > 0) return "CHROME";
        if (userAgent.indexOf("Firefox/") > 0) return "FF";
        return "UNKNOWN";
    })(),

    defer = function (cbk, t) {
        window.setTimeout(cbk, t || 0);
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
                if ( !result ) break; // if fns[i] return false value, stop the prosess
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

    log = (function () {
    var on = false,
        log = function () {
            if ( !on ) return;
            console.log.apply(console, Array.prototype.slice.call(arguments));
        };

        log.on = function () { on = true; };
        log.off = function () { on = false; };

        return log;
    }()),

    // pub/sub
    emit = (function () {
    var fireNow = function (fn) { fn(); },

        print = function (type, args) {
            log([type].concat(args));
        },

        emit = function (eventType) {
        var args = Array.prototype.slice.call(arguments, 1);
            fire(eventType, args, defer);
        },

        handlersIndex = {},

        fire = function (eventType, args, fireFn) {
        var handlers = handlersIndex[ eventType ];

            print(eventType, args);
            if ( !handlers || handlers.length === 0) return;

            fireFn(function () {
            var i = 0, target = null;

                if (args[0] && args[0] instanceof window.Event) target = args[0].target;
                for (; i < handlers.length; i++) {
                    (handlers[i] || noop).apply(target, args);
                }
            });
        };

        emit.fire = function (eventType) {
        var args = Array.prototype.slice.call(arguments, 1);
            fire(eventType, args, fireNow);
        };

        emit.addEventListener = function (eventType, callback, prepend) {
        var handlers = handlersIndex[ eventType ];
            if ( !handlers ) handlers = handlersIndex[ eventType ] = [];
            prepend ? handlers.unshift(callback) : handlers.push(callback);
        };

        return emit;
    }()),

    onevent = function (node, eventTypes, callback, capture) {
        "use strict";
    var i;

        if (typeof node === "string" || node instanceof Array) {
            capture = arguments[2];
            callback = arguments[1];
            eventTypes = arguments[0];
            node = emit;
        }
        if (typeof eventTypes === "string") eventTypes = [eventTypes];
        for (i = 0; i < eventTypes.length; i++)
            node.addEventListener(eventTypes[i], callback, capture);
    },

    offevent = function (node, eventTypes, callback) {
        // TODO
        node.removeEventListener(eventTypes, callback);
    },

    bye = function (event, a, b) {
        if (a) event.preventDefault();
        if (b) event.stopPropagation();
    };

