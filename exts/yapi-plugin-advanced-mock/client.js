import AdvMock from './AdvMock'
import mockCol from './MockCol/mockColReducer.js'

const pluginModule = function(){
  this.bindHook('interface_tab', function(tabs){
    tabs.advMock = {
      name: '高级Mock',
      component: AdvMock
    }
  })
  this.bindHook('add_reducer', function(reducerModules){
    reducerModules.mockCol = mockCol;
  })
}

export default pluginModule;
if (typeof module !== 'undefined') {
}
