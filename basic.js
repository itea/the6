var mix = markless.mix,

    noop = Function.prototype, // function () {},

    slicefn = Array.prototype.slice,
    
    browser = (function () {
        var userAgent = window.navigator.userAgent;
        if (window.opera) return "OPERA";
        if (userAgent.indexOf("Chrome/") > 0) return "CHROME";
        if (userAgent.indexOf("Firefox/") > 0) return "FF";
        return "UNKNOWN";
    })(),

    defer, // initialize later

    /*  Make arguments to an array or use the only array parameter */
    getArgsArray = function (args, i) {
        i = i || 0;
        return (args.length === 1 && args[0] instanceof Array) ? args[0].slice(i)
            : slicefn.call(args, i);
    },

    combine = function () {
    var fns = getArgsArray(arguments);

        return function () {
        var result = getArgsArray(arguments),
            i = 0, len;

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
    var on = true,
        log = function () {
            if (on) console.log.apply(console, slicefn.call(arguments));
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
        var args = slicefn.call(arguments, 1);
            fire(eventType, args, defer);
        },

        handlersIndex = {},

        fire = function (eventType, args, fireFn) {
        var handlers = handlersIndex[ eventType ];

            print(eventType, args);
            if ( !handlers || handlers.length === 0) return;

            fireFn(function () {
            var i = 0, target = null;

                for (; i < handlers.length; i++) {
                    (handlers[i] || noop).apply(target, args);
                }
            });
        };

        emit.fire = function (eventType) {
        var args = slicefn.call(arguments, 1);
            fire(eventType, args, fireNow);
        };

        emit.addEventListener = function (eventType, callback, prepend) {
        var handlers = handlersIndex[ eventType ];
            if ( !handlers ) handlers = handlersIndex[ eventType ] = [];
            prepend ? handlers.unshift(callback) : handlers.push(callback);
        };

        return emit;
    }()),

    onevent = (function () {
    /* using event manager to provide extra event management functions that browser cannot provide */
    var createEventManager = function (node) {
        var fnq = [], fnq_capture = [];

            return {
                resolve: function (event) {
                var fnque = (event || {eventPhase: 0}).eventPhase === 1 ? fnq_capture : fnq,
                    args = slicefn.call(arguments);
                    i = 0;

                    for (; i < fnque.length; i++) {
                        (fnque[i] || noop).apply(node, args);
                    }
                },
                addListener: function (fn, capture) {
                    (capture === true ? fnq_capture : fnq).push(fn);
                },
                reset: function () {
                    fnq.length = fnq_capture.length = 0;
                },
                removeListener: function (fn) {
                var i = fnq.indexOf(fn);
                    if (i > -1) fnq.splice(i, 1);
                    i = fnq_capture.indexOf(fn);
                    if (i > -1) fnq_capture.splice(i, 1);
                }/*,
                isQueueEmpty: function (capture) {
                var fnque = capture === true ? fnq_capture : fnq;
                    return fnque.length === 0;
                }*/
            };
        },

        uniqueid = 1,

        eventManagerIndex = {},

        /*
        addEventListener = function (node, eventType, fn, capture) {
        var uid = node._the6uid, mgr;

            if (!uid) uid = node._the6uid = uniqueid++;
            mgr = eventManagerIndex[eventType + "_" + uid];
            if (!mgr) {
                mgr = eventManagerIndex[eventType + "_" + uid] = createEventManager(node);
                node.addEventListener(eventType, mgr.resolve, capture);
            }
            mgr.addListener(fn, capture);
        },

        removeEventListener = function (node, eventType, fn) {
        var uid = node._the6uid,
            mgr = eventManagerIndex[eventType + "_" + uid];
            if (!mgr) return;
            mgr.removeListener(fn);
        },
        */

        // disable event manager mechanism now
        addEventListener = function (node, eventType, fn, capture) {
            node.addEventListener(eventType, fn, capture);
        },
        removeEventListener = function (node, eventType, fn) {
            node.removeEventListener(eventType, fn);
        },

        onoffloop = function (bind, args) {
        var node, types, callbacks, capture, e;
            getArg = function (expect) {
                return (typeof args[0] === expect) ? args.shift() : undefined;
            };

            while(true) {
                node = type = null;
                capture = false;
                callbacks = [];
                e = node = getArg("object");
                if (e == null) node = emit;

                e = getArg("string");
                if (e === undefined) break;
                types = e;

                while(true) {
                    e = getArg("function");
                    if (e === undefined) break;
                    callbacks.push(e);
                }

                if (callbacks.length === 0) break;
                e = getArg("boolean");
                if (e !== undefined) capture = e;

                onoff(bind, node, types, callbacks, capture);
            }
        },

        regx_blank = /\s+/,
        onoff = function (bind, node, eventTypes, callbacks, capture) {
        var types = eventTypes.split(regx_blank),
            i = 0;

            for(; i< callbacks.length; i++) {
                while (types.length > 0)
                    bind(node, types.shift(), callbacks[i], capture);
            }

        },

        /*
        onoffevent = function (fn, node, eventTypes, callback, capture) {
            "use strict";
        var i;

            if (typeof node === "string" || node instanceof Array) {
                capture = arguments[3];
                callback = arguments[2];
                eventTypes = arguments[1];
                node = emit;
            }
            if (typeof eventTypes === "string") eventTypes = [eventTypes];
            for (i = 0; i < eventTypes.length; i++)
                fn(node, eventTypes[i], callback, capture);
        },
        */

        onevent = function () {
            onoffloop(addEventListener, getArgsArray(arguments));
        },

        offevent = function () {
            onoffloop(removeEventListener, getArgsArray(arguments));
        };

        onevent.off = offevent;
        return onevent;
    }()),

    offevent = onevent.off,

    /* use faster timeouts fn: http://dbaron.org/log/20100309-faster-timeouts */
    defer = (function () {
    var q = [];
        onevent(window, "message", function (event) {
            if ("*defer*" !== event.data) return;
            while( q.length > 0 ) q.shift()();
        }, true);

        return function (cbk, t) {
            t ?  window.setTimeout(cbk, t) :
                (q.push(cbk), window.postMessage("*defer*", "*") );
        };
    }()),

    bye = function (event, a, b) {
        if (a) event.preventDefault();
        if (b) event.stopPropagation();
    };

    Array.prototype.applyOn = function (fn, o) {
        return fn.apply(o, this);
    };

    Object.defineProperty(Array.prototype, 'applyOn', {'enumerable': false});

