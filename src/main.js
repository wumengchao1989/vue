var config      = require('./config'),
    Seed        = require('./seed'),
    directives  = require('./directives'),
    filters     = require('./filters'),
    textParser  = require('./text-parser')

var controllers = config.controllers,
    datum       = config.datum,
    api         = {},
    reserved    = ['datum', 'controllers'],
    booted      = false

/*
 *  Store a piece of plain data in config.datum
 *  so it can be consumed by sd-data
 */
api.data = function (id, data) {
    if (!data) return datum[id]
    datum[id] = data
}

/*
 *  Store a controller function in config.controllers test
 *  so it can be consumed by sd-controller
 */
api.controller = function (id, extensions) {
    if (!extensions) return controllers[id]
    controllers[id] = extensions
}

/*
 *  Allows user to create a custom directive
 */
api.directive = function (name, fn) {
    if (!fn) return directives[name]
    directives[name] = fn
}

/*
 *  Allows user to create a custom filter
 */
api.filter = function (name, fn) {
    if (!fn) return filters[name]
    filters[name] = fn
}

/*
 *  Bootstrap the whole thing
 *  by creating a Seed instance for top level nodes
 *  that has either sd-controller or sd-data
 */
api.bootstrap = function (opts) {
    if (booted) return
    if (opts) {
        for (var key in opts) {
            if (reserved.indexOf(key) === -1) {
                config[key] = opts[key]//将配置参数对象导入config
            }
        }
    }
    textParser.buildRegex()//构建正则,生成正则表达式/{{(.+?)}},用来解析html中的{{data}},用于数据绑定
    // build new reg expression "{{(.+?)}}",which is used for parse elements in the format of "{{xxx}}" in HTML;
    var el,
        ctrlSlt = '[' + config.prefix + '-controller]',
        dataSlt = '[' + config.prefix + '-data]',
        seeds   = []
    /* jshint boss: true */
    while (el = document.querySelector(ctrlSlt) || document.querySelector(dataSlt)) {
        seeds.push((new Seed(el)).scope)//获取所有带有[su-controller]或者[su-data]属性的元素,并用这些元素生成Seed对象
        //get all element in template which contain attributes of [su-controller] or [su-data]
    }
    booted = true//设置booted为true,只boot一次;set booted as true,so it will only boot once;
    return seeds.length > 1 ? seeds : seeds[0]
}

module.exports = api