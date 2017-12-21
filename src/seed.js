var config          = require('./config'),
    Scope           = require('./scope'),
    Binding         = require('./binding'),
    DirectiveParser = require('./directive-parser'),
    TextParser      = require('./text-parser'),
    depsParser      = require('./deps-parser')

var slice           = Array.prototype.slice,
    ctrlAttr        = config.prefix + '-controller',
    eachAttr        = config.prefix + '-each'

/*
 *  The main ViewModel class
 *  scans a node and parse it to populate data bindings
 */
function Seed (el, options) {

    if (typeof el === 'string') {
        el = document.querySelector(el)
    }

    this.el         = el
    el.seed         = this
    this._bindings  = {}
    this._computed  = []

    // copy options
    options = options || {}
    for (var op in options) {
        this[op] = options[op]//深拷贝
    }

    // check if there's passed in data
    var dataAttr = config.prefix + '-data',
        dataId = el.getAttribute(dataAttr),
        data = (options && options.data) || config.datum[dataId]
    if (config.debug && dataId && !data) {
        console.warn('data "' + dataId + '" is not defined.')
    }
    data = data || {}
    el.removeAttribute(dataAttr)

    // if the passed in data is the scope of a Seed instance,
    // make a copy from it
    if (data.$seed instanceof Seed) {
        data = data.$dump()
    }

    // initialize the scope object
    var scope = this.scope = new Scope(this, options)

    // copy data
    for (var key in data) {
        scope[key] = data[key]
    }

    // if has controller function, apply it so we have all the user definitions
    var ctrlID = el.getAttribute(ctrlAttr)
    if (ctrlID) {
        el.removeAttribute(ctrlAttr)
        var factory = config.controllers[ctrlID]
        if (factory) {
            factory(this.scope)
        } else if (config.debug) {
            console.warn('controller "' + ctrlID + '" is not defined.')
        }
    }

    // now parse the DOM
    this._compileNode(el, true)

    // extract dependencies for computed properties
    depsParser.parse(this._computed)
    delete this._computed
}

// for better compression
var SeedProto = Seed.prototype

/*
 *  Compile a DOM node (recursive)
 */
SeedProto._compileNode = function (node, root) {//递归的方式遍历节点内部所有的元素,解析出元素中的directive和绑定的数据
    var seed = this

    if (node.nodeType === 3) { // text node

        seed._compileTextNode(node)

    } else if (node.nodeType === 1) {

        var eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr)//解析controller node

        if (eachExp) { // each block

            var directive = DirectiveParser.parse(eachAttr, eachExp)
            if (directive) {
                directive.el = node
                seed._bind(directive)//绑定指令
            }

        } else if (ctrlExp && !root) { // nested controllers

            new Seed(node, {
                child: true,
                parentSeed: seed
            })//如果判断是controller,递归Seed;

        } else { // normal node

            // parse if has attributes
            if (node.attributes && node.attributes.length) {
                // forEach vs for loop perf comparison: http://jsperf.com/for-vs-foreach-case
                // takeaway: not worth it to wrtie manual loops.
                slice.call(node.attributes).forEach(function (attr) {
                    if (attr.name === ctrlAttr) return
                    var valid = false
                    attr.value.split(',').forEach(function (exp) {
                        var directive = DirectiveParser.parse(attr.name, exp)
                        if (directive) {
                            valid = true
                            directive.el = node
                            seed._bind(directive)
                        }
                    })
                    if (valid) node.removeAttribute(attr.name)
                })
            }

            // recursively compile childNodes
            if (node.childNodes.length) {
                slice.call(node.childNodes).forEach(seed._compileNode, seed)
            }
        }
    }
}

/*
 *  Compile a text node
 */
SeedProto._compileTextNode = function (node) {
    var tokens = TextParser.parse(node)
    if (!tokens) return
    var seed = this,
        dirname = config.prefix + '-text',
        el, token, directive
    for (var i = 0, l = tokens.length; i < l; i++) {
        token = tokens[i]
        el = document.createTextNode()
        if (token.key) {
            directive = DirectiveParser.parse(dirname, token.key)
            if (directive) {
                directive.el = el
                seed._bind(directive)
            }
        } else {
            el.nodeValue = token
        }
        node.parentNode.insertBefore(el, node)
    }
    node.parentNode.removeChild(node)
}

/*
 *  Add a directive instance to the correct binding & scope
 */
SeedProto._bind = function (directive) {
    //这版本directive用的是对象形式,包含key,value
    var key = directive.key,
        seed = directive.seed = this

    // deal with each block
    if (this.each) {
        if (key.indexOf(this.eachPrefix) === 0) {
            key = directive.key = key.replace(this.eachPrefix, '')
        } else {
            seed = this.parentSeed
        }
    }

    // deal with nesting
    seed = traceOwnerSeed(directive, seed)
    var binding = seed._bindings[key] || seed._createBinding(key)

    // add directive to this binding
    binding.instances.push(directive)
    directive.binding = binding

    // invoke bind hook if exists
    if (directive.bind) {
        directive.bind(binding.value)
    }

    // set initial value
    directive.update(binding.value)
    if (binding.isComputed) {
        directive.refresh()
    }
}

/*
 *  Create binding and attach getter/setter for a key to the scope object
 */
SeedProto._createBinding = function (key) {
    var binding = new Binding(this, key)
    this._bindings[key] = binding
    if (binding.isComputed) this._computed.push(binding)
    return binding
}

/*
 *  Call unbind() of all directive instances
 *  to remove event listeners, destroy child seeds, etc.
 */
SeedProto._unbind = function () {
    var i, ins
    for (var key in this._bindings) {
        ins = this._bindings[key].instances
        i = ins.length
        while (i--) {
            if (ins[i].unbind) ins[i].unbind()
        }
    }
}

/*
 *  Unbind and remove element
 */
SeedProto._destroy = function () {
    this._unbind()
    this.el.parentNode.removeChild(this.el)
}

// Helpers --------------------------------------------------------------------

/*
 *  determine which scope a key belongs to based on nesting symbols
 */
function traceOwnerSeed (key, seed) {
    if (key.nesting) {
        var levels = key.nesting
        while (seed.parentSeed && levels--) {
            seed = seed.parentSeed
        }
    } else if (key.root) {
        while (seed.parentSeed) {
            seed = seed.parentSeed
        }
    }
    return seed
}

module.exports = Seed