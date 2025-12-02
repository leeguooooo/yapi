import swaggerAutoSync from './swaggerAutoSync/swaggerAutoSync.js'

function hander(routers) {
  routers.test = {
    name: 'Swagger自动同步',
    component: swaggerAutoSync
  };
}

const pluginModule = function() {
  this.bindHook('sub_setting_nav', hander);
};

export default pluginModule;
if (typeof module !== 'undefined') {
}
