import './openapi3.scss';

function exportOpenAPI3(exportDataModule, pid) {
  exportDataModule.openapi3 = {
    name: 'OpenAPI 3.1',
    route: `/api/plugin/export?type=openapi3&pid=${pid}`,
    desc: '导出 OpenAPI 3.1 规范数据，支持 oneOf/anyOf/discriminator 等特性'
  };
}

module.exports = function() {
  this.bindHook('export_data', exportOpenAPI3);
};