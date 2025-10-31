const _ = require('underscore');
const OpenAPIParser = require('@readme/openapi-parser');
const $RefParser = require('@apidevtools/json-schema-ref-parser');

let openApiData;

function handlePath(path) {
  if (path === '/') return path;
  if (path.charAt(0) != '/') {
    path = '/' + path;
  }
  if (path.charAt(path.length - 1) === '/') {
    path = path.substr(0, path.length - 1);
  }
  return path;
}

function detectCompositionType(schema) {
  if (schema.oneOf || schema.anyOf || schema.allOf) {
    // 返回组合模式的完整信息，而不是展平
    const composition = {};
    
    if (schema.oneOf) {
      composition.type = 'oneOf';
      composition.schemas = schema.oneOf;
    } else if (schema.anyOf) {
      composition.type = 'anyOf';  
      composition.schemas = schema.anyOf;
    } else if (schema.allOf) {
      composition.type = 'allOf';
      composition.schemas = schema.allOf;
    }
    
    // 保存 discriminator 信息
    if (schema.discriminator) {
      composition.discriminator = schema.discriminator;
    }
    
    return composition;
  }
  return null;
}

function extractServers(openapi) {
  if (!openapi.servers || !Array.isArray(openapi.servers)) {
    return [];
  }
  
  return openapi.servers.map(server => ({
    url: server.url || '',
    description: server.description || '',
    variables: server.variables || {}
  }));
}

function extractWebhooks(openapi) {
  return openapi.webhooks || {};
}

function handleRequestBody(requestBody, api) {
  if (!requestBody) return;
  
  api.req_body_type = 'json';
  api.req_body_is_json_schema = true;

  if (requestBody.content) {
    const contentTypes = Object.keys(requestBody.content);
    
    if (contentTypes.includes('application/json')) {
      const jsonContent = requestBody.content['application/json'];
      if (jsonContent.schema) {
        const composition = detectCompositionType(jsonContent.schema);
        if (composition) {
          // 保存组合模式信息到专门字段
          api.schema_composition = composition;
          // 对于请求体，使用第一个schema作为示例展示
          const exampleSchema = composition.schemas && composition.schemas[0] 
            ? composition.schemas[0] 
            : jsonContent.schema;
          api.req_body_other = JSON.stringify(exampleSchema, null, 2);
        } else {
          api.req_body_other = JSON.stringify(jsonContent.schema, null, 2);
        }
      }
    } else if (contentTypes.includes('application/x-www-form-urlencoded') || 
               contentTypes.includes('multipart/form-data')) {
      api.req_body_type = 'form';
      const formContent = requestBody.content[contentTypes[0]];
      
      if (formContent.schema && formContent.schema.properties) {
        api.req_body_form = [];
        Object.keys(formContent.schema.properties).forEach(propName => {
          const prop = formContent.schema.properties[propName];
          api.req_body_form.push({
            name: propName,
            type: prop.type === 'string' && prop.format === 'binary' ? 'file' : 'text',
            desc: prop.description || '',
            required: formContent.schema.required && formContent.schema.required.includes(propName) ? '1' : '0',
            example: prop.example || ''
          });
        });
      }
    }
  }
}

function handleParameters(parameters, api) {
  if (!parameters || !Array.isArray(parameters)) return;

  parameters.forEach(param => {
    const defaultParam = {
      name: param.name,
      desc: param.description || '',
      required: param.required ? '1' : '0',
      example: param.example || (param.schema && param.schema.example) || ''
    };

    switch (param.in) {
      case 'path':
        api.req_params.push(defaultParam);
        break;
      case 'query':
        api.req_query.push(defaultParam);
        break;
      case 'header':
        if (param.name.toLowerCase() !== 'content-type') {
          api.req_headers.push(defaultParam);
        }
        break;
      case 'cookie':
        api.req_headers.push({
          ...defaultParam,
          name: 'Cookie',
          desc: `${param.name}: ${defaultParam.desc}`
        });
        break;
    }
  });
}

function handleResponseWithComposition(responses, api) {
  if (!responses || typeof responses !== 'object') {
    return '';
  }

  const codes = Object.keys(responses);
  let curCode;
  
  if (codes.includes('200')) {
    curCode = '200';
  } else if (codes.includes('201')) {
    curCode = '201';
  } else {
    curCode = codes[0];
  }

  const response = responses[curCode];
  if (!response) return '';

  if (response.content) {
    const contentTypes = Object.keys(response.content);
    
    if (contentTypes.includes('application/json')) {
      const jsonContent = response.content['application/json'];
      if (jsonContent.schema) {
        const composition = detectCompositionType(jsonContent.schema);
        if (composition) {
          // 如果请求体没有设置组合模式，用响应体的组合模式
          if (!api.schema_composition) {
            api.schema_composition = composition;
          }
          // 返回第一个schema作为示例
          const exampleSchema = composition.schemas && composition.schemas[0] 
            ? composition.schemas[0] 
            : jsonContent.schema;
          return JSON.stringify(exampleSchema, null, 2);
        }
        return JSON.stringify(jsonContent.schema, null, 2);
      }
    }
  }

  return response.description || '';
}

function handleOpenAPIData(data, originTags = []) {
  let api = {};
  
  api.method = data.method.toUpperCase();
  api.title = data.summary || data.operationId || data.path;
  api.desc = data.description || '';
  api.markdown = data.description || '';
  api.catname = null;
  api.deprecated = data.deprecated || false;
  
  if (data.tags && Array.isArray(data.tags)) {
    api.tag = data.tags;
    for (let i = 0; i < data.tags.length; i++) {
      if (/v[0-9\.]+/.test(data.tags[i])) {
        continue;
      }

      if (originTags.length > 0 && _.find(originTags, item => item.name === data.tags[i])) {
        api.catname = data.tags[i];
        break;
      }

      if (originTags.length === 0) {
        api.catname = data.tags[i];
        break;
      }
    }
  }

  api.path = handlePath(data.path);
  api.req_params = [];
  api.req_body_form = [];
  api.req_headers = [];
  api.req_query = [];
  api.req_body_type = 'raw';
  api.res_body_type = 'json';
  api.res_body_is_json_schema = true;

  handleParameters(data.parameters, api);
  handleRequestBody(data.requestBody, api);
  
  const responseResult = handleResponseWithComposition(data.responses, api);
  api.res_body = responseResult;
  
  try {
    JSON.parse(api.res_body);
    api.res_body_type = 'json';
    api.res_body_is_json_schema = true;
  } catch (e) {
    api.res_body_type = 'raw';
  }

  if (openApiData.servers) {
    api.servers = extractServers(openApiData);
  }

  if (data.callbacks) {
    api.callbacks = data.callbacks;
  }

  if (data.links) {
    api.links = data.links;
  }

  api.openapi_raw = {
    operationId: data.operationId,
    tags: data.tags,
    summary: data.summary,
    description: data.description,
    parameters: data.parameters,
    requestBody: data.requestBody,
    responses: data.responses,
    callbacks: data.callbacks,
    deprecated: data.deprecated,
    security: data.security,
    servers: data.servers,
    links: data.links
  };

  return api;
}

async function run(res) {
  let interfaceData = { apis: [], cats: [] };
  
  if (typeof res === 'string' && res) {
    try {
      res = JSON.parse(res);
    } catch (e) {
      console.error('JSON 解析出错', e.message);
      return interfaceData;
    }
  }

  if (!res.openapi) {
    throw new Error('不是有效的 OpenAPI 规范文档');
  }

  try {
    // 验证和解析 OpenAPI 文档
    let api;
    try {
      // 验证 OpenAPI 文档格式
      await OpenAPIParser.validate(res);
      api = res;
    } catch (parseError) {
      // 如果验证失败，仍然尝试处理
      console.warn('OpenAPI 验证警告:', parseError.message);
      api = res;
    }
    
    // 解析 $ref 引用
    let dereferenced;
    try {
      dereferenced = await $RefParser.dereference(api, { mutateInputSchema: false });
    } catch (refError) {
      console.warn('$ref 解析警告:', refError.message);
      dereferenced = api;
    }
    
    openApiData = dereferenced;
    
    interfaceData.basePath = '';
    
    if (openApiData.servers && openApiData.servers.length > 0) {
      const firstServer = openApiData.servers[0];
      try {
        const url = new URL(firstServer.url);
        interfaceData.basePath = url.pathname;
      } catch (e) {
        interfaceData.basePath = firstServer.url;
      }
    }

    if (openApiData.webhooks) {
      interfaceData.webhooks = extractWebhooks(openApiData);
    }

    if (openApiData.tags && Array.isArray(openApiData.tags)) {
      openApiData.tags.forEach(tag => {
        interfaceData.cats.push({
          name: tag.name,
          desc: tag.description || tag.name
        });
      });
    } else {
      openApiData.tags = [];
    }

    if (!openApiData.paths) {
      console.warn('OpenAPI 文档中没有找到 paths');
      return interfaceData;
    }
    
    _.each(openApiData.paths, (apis, path) => {
      delete apis.parameters;
      _.each(apis, (api, method) => {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          api.path = path;
          api.method = method;
          let data = null;
          try {
            data = handleOpenAPIData(api, openApiData.tags);
            
            // 处理分类
            if (data.catname) {
              if (!_.find(interfaceData.cats, item => item.name === data.catname)) {
                interfaceData.cats.push({
                  name: data.catname,
                  desc: data.catname
                });
              }
            } else {
              // 如果没有分类，创建默认分类
              const defaultCat = 'default';
              if (!_.find(interfaceData.cats, item => item.name === defaultCat)) {
                interfaceData.cats.push({
                  name: defaultCat,
                  desc: '默认分类'
                });
              }
              data.catname = defaultCat;
            }
          } catch (err) {
            console.error('处理接口出错:', path, method, err.message);
            data = null;
          }
          if (data) {
            interfaceData.apis.push(data);
          }
        }
      });
    });

    interfaceData.cats = interfaceData.cats.filter(catData => {
      let catName = catData.name;
      return _.find(interfaceData.apis, apiData => {
        return apiData.catname === catName;
      });
    });

    if (interfaceData.apis.length === 0) {
      console.warn('没有解析到任何接口数据');
    }

  } catch (err) {
    console.error('OpenAPI 解析失败:', err.message);
    throw new Error(`OpenAPI 解析失败: ${err.message}`);
  }

  return interfaceData;
}

module.exports = run;