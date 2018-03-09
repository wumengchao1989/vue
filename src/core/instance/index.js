import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

console.log("1.vue框架实际执行的第一行,接下来声明Vue构造函数,然后通过initMixin,stateMixin,eventMixin,lifecycleMixin,renderMixin分别为Vue构造函数添加原型方法");
function Vue (options) {
  /*构造函数的执行机制:
  (所有函数在创建的时候会自动根据一组特定规则为该函数创建一个prototype属性,这个属性指向函数的原型对象.默认情况下,该原型对象会自动获得一个constructor属性,指向构造函数本身)
  * 1.生成一个Object对象实例;
  * 2.将构造函数this指向所创建的对象实例;
  * 3.对象实例的[prototype]属性指向构造函数的prototype;
  * 4.返回对象实例;
  * */
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')//构造函数的this指向创建的实例,判断创建的实例是否为Vue的类型,
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
