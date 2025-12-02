import { message } from 'antd';
import './openapi3.scss';

const pluginModule = function() {
  this.bindHook('import_data', function(importDataModule) {
    if (!importDataModule || typeof importDataModule !== 'object') {
      console.error('importDataModule 参数Must be Object Type');
      return null;
    }
    importDataModule.openapi3 = {
      name: 'OpenAPI 3.x',
      run: function(res) {
        // The actual parsing logic is handled on the server side
        // This is just a placeholder for the client-side hook
        return Promise.resolve(res);
      },
      desc: `<p>OpenAPI 3.x 数据导入（支持 v3.0+ 和 v3.1.x）</p>
      <p>支持 oneOf/anyOf/allOf 组合模式和 discriminator</p>`
    };
  });
};

export default pluginModule;
if (typeof module !== 'undefined') {
}
