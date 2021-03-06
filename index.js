(function(global, factory) {
    //CommonJS/Node
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    //AMD
    typeof define === 'function' && define.amd ? define(factory) :
    //No module loader
    (global.dzPromise = factory());
}(this, (function() { 
    
    var PENDING = 0;
    var FULFILLED = 1;
    var REJECTED = 2;

    function dzPromise(fn){
        //state，可以是PENDING、FULFILLED 、REJECTED;
        var state = PENDING;
        //储存promise回调时的value或是error
        var value = null;
        //成功OR失败的处理程序，通过.then()或.done()调用得到。
        var handlers = [];


        function fulfill(result) {
            state = FULFILLED;
            value = result;
            handlers.forEach(handle);
            handlers = null;
        }
        
        function reject(error) {
            state = REJECTED;
            value = error;
            handlers.forEach(handle);
            handlers = null;
        }
        
        function resolve(result) {
            try {
                var then = getThen(result);
                if (then) {
                    doResolve(then.bind(result), resolve, reject);
                    return;
                }
                fulfill(result);
            } catch(ex) {
                reject(ex);
            }
        }
        
        function handle(handler) {
            if (state === PENDING) {
                handlers.push(handler);
            } else {
                if (state === FULFILLED && typeof handler.onFulfilled === 'function') {
                    handler.onFulfilled(value);
                }
                if (state === REJECTED && typeof handler.onRejected === 'function') {
                    handler.onRejected(value);
                }
            }
        }
        
        this.done = function(onFulfilled, onRejected) {
            setTimeout(function() {
                handle({
                    onFulfilled: onFulfilled,
                    onRejected: onRejected
                });
            }, 0);
        };
        
        this.then = function(onFulfilled, onRejected) {
            var self = this;
            return new dzPromise(function(resolve, reject) {
                return self.done(function(result) {
                    if (typeof onFulfilled === 'function') {
                        try {
                            return resolve(onFulfilled(result));
                        } catch(ex) {
                            return reject(ex);
                        }
                    } else {
                        return resolve(result);
                    }
                }, function(error) {
                    if (typeof onRejected === 'function') {
                        try {
                            return resolve(onRejected(error));
                        } catch(ex) {
                            return reject(ex);
                        }
                    } else {
                        return reject(error);
                    }
                });
            });
        };
        doResolve(fn,resolve,reject);
        
    }

    function doResolve(fn, onFulfilled, onRejected) {
        var done = false;
        try {   
            fn(function(value) {
                if (done) return;
                done = true;
                onFulfilled(value);
            }, function(reason) {
                if (done) return;
                done = true;
                onRejected(reason);
            });
        } catch(ex) {
            if (done) return;
            done = true;
            onRejected(ex);
        }
    }


    function getThen(value) {
        var t = typeof value;
        if (value && (t === 'object' || t === 'function')) {
            var then = value.then;
            if (typeof then === 'function') {
                return then;
            }
        }
        return null;
    }
    return dzPromise;
})));