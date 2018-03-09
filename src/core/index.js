import Vue from './instance/index'
import {initGlobalAPI} from './global-api/index'
import {isServerRendering} from 'core/util/env'

console.log("7.import已经经过instance中处理过的Vue,使用initGlobalApi进一步加工")
initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
    get: isServerRendering
})

Vue.version = '__VERSION__'

export default Vue
