function hander(routers) {
  routers.test = {
    name: 'test',
    component: ()=> 'hello world.'
  };
}

export default function() {
if (typeof module !== "undefined") { module.exports = exports.default; }

  this.bindHook('sub_setting_nav', hander);
};
