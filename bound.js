define(['pubsub'], function (ps) {
    /*
        Function.bind Polyfill for ECMAScript 5 Support
        Kangax's bind with Broofa's arg optimization.
        http://www.broofa.com/Tools/JSLitmus/tests/PrototypeBind.html
     */
    if (typeof Function.prototype.bind !== 'function') {
        Function.prototype.bind = function() {
            var slice = Array.prototype.slice;
            return function(context) {
                var fn = this,
                    args = slice.call(arguments, 1);
                if (args.length) {
                    return function() {
                        return arguments.length
                            ? fn.apply(context, args.concat(slice.call(arguments)))
                            : fn.apply(context, args);
                    };
                }
                return function() {
                    return arguments.length
                        ? fn.apply(context, arguments)
                        : fn.call(context);
                };
            };
        };
    }

    function Bound (id) {
        this.doc = window.document;
        this.dataAttribute = 'data-bind-' + id;
        this.eventType = id + ':change';
        this.element = document.querySelector('[' + this.dataAttribute + ']');
        this.previousValue = this.isFormElement() ? this.element.getAttribute(this.dataAttribute) : this.element.innerHTML; // TODO: decide how this should work? should element (form or whatever have no value initially? so only via custom data attribute)
        this.currentValue = this.previousValue;
        this.bindEvents();

        // The 'change' event fires when an input loses focus
        if ('addEventListener' in window) {
            this.doc.addEventListener('change', this.listener.bind(this), false);
        } else {
            this.doc.attachEvent('onchange', this.listener.bind(this));
        }

        // TODO: 
        // Look at elements that aren't form based.
        // Check if this event needs to be binded for each new instance or not.
    }

    Bound.prototype.isFormElement = function(){
        return /input|textarea|select/.test(this.element.tagName.toLowerCase()) ? true : false;
    };

    Bound.prototype.bindEvents = function(){
        this.subscription = ps.subscribe(this.eventType, this.handler.bind(this));
    };

    Bound.prototype.handler = function (eventType, data) {
        // TODO: need to look at better way to check this as (for example) with a div we don't want to store its content in a DOM property
        if (!this.hasValueChanged(data, this.previousValue)) {
            console.log('values have not changed, so do not bother updating values');
            return;
        }

        this.previousValue = this.currentValue;
        this.currentValue = data;

        console.group();
            console.log('previous DOM property: ', this.previousValue);
            console.log('current DOM property: ', this.currentValue);
        console.groupEnd();

        // TODO: no point changing the value when interacting directly via the UI
        if (this.isFormElement()) {
            this.element.value = this.currentValue;
        } else {
            this.element.innerHTML = this.currentValue;
        }
    };

    Bound.prototype.listener = function (e) {
        var target = e.target || e.srcElement;

        ps.publish(this.eventType, target.value);
    };

    Bound.prototype.hasValueChanged = function (newvalue, previous) {
        return newvalue !== previous;
    };    

    Bound.prototype.get = function (newValue) {
        return this.currentValue;
    };

    Bound.prototype.set = function (newValue) {
        ps.publish(this.eventType, newValue);
    };

    return Bound;
});