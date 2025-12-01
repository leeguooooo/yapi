import WikiPage from './wikiPage/index';
// const WikiPage = require('./wikiPage/index')

const pluginModule = function() {
  this.bindHook('sub_nav', function(app) {
    app.wiki = {
      name: 'Wiki',
      path: '/project/:id/wiki',
      component: WikiPage
    };
  });
};

module.exports = pluginModule;
export default pluginModule;
