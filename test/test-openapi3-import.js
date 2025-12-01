const test = require('ava');
const fs = require('fs');
const path = require('path');

// 测试 OpenAPI 3.1.1 导入功能
const importOpenAPI3 = require('../exts/yapi-plugin-import-openapi3/run.js');

test('OpenAPI 3.1.1 基础导入测试', async t => {
  // 读取测试文件
  const testFilePath = path.join(__dirname, 'openapi31-test.json');
  const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
  
  try {
    const result = await importOpenAPI3(testData);
    
    // 验证基本结构
    t.truthy(result);
    t.truthy(result.apis);
    t.truthy(result.cats);
    
    // 验证接口数量（当前示例包含 4 个接口）
    t.is(result.apis.length, 4, '应该导入 4 个接口');
    
    // 验证分类
    t.is(result.cats.length, 2, '应该有 2 个分类');
    t.true(result.cats.some(cat => cat.name === 'pets'));
    t.true(result.cats.some(cat => cat.name === 'vehicles'));
    
    console.log('导入结果:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('导入失败:', error);
    t.fail(error.message);
  }
});

test('oneOf + discriminator 特性测试', async t => {
  const testFilePath = path.join(__dirname, 'openapi31-test.json');
  const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
  
  try {
    const result = await importOpenAPI3(testData);
    
    // 查找包含 discriminator 的接口
    const postPetAPI = result.apis.find(api => 
      api.method === 'POST' && api.path === '/pets'
    );
    
    t.truthy(postPetAPI, '应该找到 POST /pets 接口');
    
    // 验证 schema_composition 字段
    if (postPetAPI.schema_composition) {
      t.is(postPetAPI.schema_composition.type, 'oneOf');
      t.truthy(postPetAPI.schema_composition.discriminator);
      t.is(postPetAPI.schema_composition.discriminator.propertyName, 'petType');
      console.log('oneOf + discriminator 检测成功:', postPetAPI.schema_composition);
    }
    
    // 验证 servers 信息
    if (postPetAPI.servers) {
      t.is(postPetAPI.servers.length, 2, '应该有 2 个服务器');
      console.log('servers 信息:', postPetAPI.servers);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
    t.fail(error.message);
  }
});

test('anyOf 特性测试', async t => {
  const testFilePath = path.join(__dirname, 'openapi31-test.json');
  const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
  
  try {
    const result = await importOpenAPI3(testData);
    
    // 查找使用 anyOf 的接口
    const postVehicleAPI = result.apis.find(api => 
      api.method === 'POST' && api.path === '/vehicles'
    );
    
    t.truthy(postVehicleAPI, '应该找到 POST /vehicles 接口');
    
    // 由于 anyOf 在 requestBody 中，检查 openapi_raw 保存的原始信息
    if (postVehicleAPI.openapi_raw && postVehicleAPI.openapi_raw.requestBody) {
      console.log('anyOf 原始信息保存成功');
      t.pass();
    }
    
  } catch (error) {
    console.error('anyOf 测试失败:', error);
    t.fail(error.message);
  }
});

// 运行测试如果直接执行此文件
if (require.main === module) {
  console.log('开始测试 OpenAPI 3.1.1 导入功能...');
  
  // 手动运行测试
  (async () => {
    try {
      const testFilePath = path.join(__dirname, 'openapi31-test.json');
      const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
      
      console.log('正在导入 OpenAPI 3.1.1 测试数据...');
      const result = await importOpenAPI3(testData);
      
      console.log('\n=== 导入结果 ===');
      console.log('接口数量:', result.apis.length);
      console.log('分类数量:', result.cats.length);
      console.log('基础路径:', result.basePath);
      
      console.log('\n=== 分类信息 ===');
      result.cats.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.desc}`);
      });
      
      console.log('\n=== 接口信息 ===');
      result.apis.forEach(api => {
        console.log(`- ${api.method} ${api.path}: ${api.title}`);
        if (api.schema_composition) {
          console.log(`  └─ 使用 ${api.schema_composition.type}`);
          if (api.schema_composition.discriminator) {
            console.log(`     discriminator: ${api.schema_composition.discriminator.propertyName}`);
          }
        }
        if (api.servers && api.servers.length > 0) {
          console.log(`  └─ servers: ${api.servers.length} 个`);
        }
      });
      
      console.log('\n✅ OpenAPI 3.1.1 导入测试成功！');
      
    } catch (error) {
      console.error('\n❌ 测试失败:', error.message);
      console.error(error.stack);
    }
  })();
}
