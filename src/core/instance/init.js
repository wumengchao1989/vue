/* @flow */

import config from '../config'
import {initProxy} from './proxy'
import {initState} from './state'
import {initRender} from './render'
import {initEvents} from './events'
import {mark, measure} from '../util/perf'
import {initLifecycle, callHook} from './lifecycle'
import {initProvide, initInjections} from './inject'
import {extend, mergeOptions, formatComponentName} from '../util/index'

let uid = 0

export function initMixin(Vue: Class<Component>) {
    console.log("2.initMixin,首先在Vue的原型上挂载_init方法");
    Vue.prototype._init = function (options?: Object) {
        console.log("8.1 init第一步,vm指代构造函数Vue创建的对象实例");
        const vm: Component = this

        // a uid
        vm._uid = uid++

        let startTag, endTag
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
            startTag = `vue-perf-init:${vm._uid}`
            /* console.log("`${}`语法,用于字符串与变量的拼接");*/
            endTag = `vue-perf-end:${vm._uid}`
            mark(startTag)
        }

        // a flag to avoid this being observed
        vm._isVue = true
        // merge options
        if (options && options._isComponent) {
            // optimize internal component instantiation
            // since dynamic options merging is pretty slow, and none of the
            // internal component options needs special treatment.
            initInternalComponent(vm, options)
        } else {
            console.log("8.2合并所有组件的options,mergeOptions包含三个参数:parent,child,vm,内部通过递归的方式将所有子组件的option一起合并,最后赋值给vm,做为最终的option" +
                "其中初始阶段通过resolveConstructorOptions方法初始化根组件options");
            vm.$options = mergeOptions(
                resolveConstructorOptions(vm.constructor),
                options || {},
                vm
            )
        }
        /* istanbul ignore else */
        if (process.env.NODE_ENV !== 'production') {
            initProxy(vm)
        } else {
            vm._renderProxy = vm
        }
        // expose real self
        vm._self = vm
        initLifecycle(vm)
        initEvents(vm)
        initRender(vm)
        callHook(vm, 'beforeCreate')
        initInjections(vm) // resolve injections before data/props
        initState(vm)
        initProvide(vm) // resolve provide after data/props
        callHook(vm, 'created')

        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
            vm._name = formatComponentName(vm, false)
            mark(endTag)
            measure(`${vm._name} init`, startTag, endTag)
        }

        if (vm.$options.el) {
            vm.$mount(vm.$options.el)
        }
    }
}

function initInternalComponent(vm: Component, options: InternalComponentOptions) {
    const opts = vm.$options = Object.create(vm.constructor.options)
    // doing this because it's faster than dynamic enumeration.
    opts.parent = options.parent
    opts.propsData = options.propsData
    opts._parentVnode = options._parentVnode
    opts._parentListeners = options._parentListeners
    opts._renderChildren = options._renderChildren
    opts._componentTag = options._componentTag
    opts._parentElm = options._parentElm
    opts._refElm = options._refElm
    if (options.render) {
        opts.render = options.render
        opts.staticRenderFns = options.staticRenderFns
    }
}

export function resolveConstructorOptions(Ctor: Class<Component>) {
    console.log("8.2.1解析构造函数中的option,Ctor指代构造函数");
    let options = Ctor.options

    if (Ctor.super) {
        const superOptions = resolveConstructorOptions(Ctor.super)
        const cachedSuperOptions = Ctor.superOptions
        if (superOptions !== cachedSuperOptions) {
            // super option changed,
            // need to resolve new options.
            Ctor.superOptions = superOptions
            // check if there are any late-modified/attached options (#4976)
            const modifiedOptions = resolveModifiedOptions(Ctor)
            // update base extend options
            if (modifiedOptions) {
                extend(Ctor.extendOptions, modifiedOptions)
            }
            options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
            if (options.name) {
                options.components[options.name] = Ctor
            }
        }
    }
    return options
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
    let modified
    const latest = Ctor.options
    const extended = Ctor.extendOptions
    const sealed = Ctor.sealedOptions
    for (const key in latest) {
        if (latest[key] !== sealed[key]) {
            if (!modified) modified = {}
            modified[key] = dedupe(latest[key], extended[key], sealed[key])
        }
    }
    return modified
}

function dedupe(latest, extended, sealed) {
    // compare latest and sealed to ensure lifecycle hooks won't be duplicated
    // between merges
    if (Array.isArray(latest)) {
        const res = []
        sealed = Array.isArray(sealed) ? sealed : [sealed]
        extended = Array.isArray(extended) ? extended : [extended]
        for (let i = 0; i < latest.length; i++) {
            // push original options and not sealed options to exclude duplicated options
            if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
                res.push(latest[i])
            }
        }
        return res
    } else {
        return latest
    }
}
