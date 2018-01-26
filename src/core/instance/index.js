import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

console.log("1.vue框架实际执行的第一行,接下来声明Vue构造函数,然后通过initMixin,stateMixin,eventMixin,lifecycleMixin,renderMixin分别为Vue构造函数添加原型方法");
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  console.log("7.在用户new Vue时,开始执行_init,option为参数")
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
