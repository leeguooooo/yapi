const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
const interfaceCatModel = require('models/interfaceCat.js');
const yapi = require('yapi.js');

class exportOpenAPI3Controller extends baseController {
    constructor(ctx) {
        super(ctx);
        this.catModel = yapi.getInst(interfaceCatModel);
        this.interModel = yapi.getInst(interfaceModel);
        this.projectModel = yapi.getInst(projectModel);
    }

    async handleListClass(pid, status) {
        let result = await this.catModel.list(pid),
            newResult = [];
        for (let i = 0, item, list; i < result.length; i++) {
            item = result[i].toObject();
            list = await this.interModel.listByInterStatus(item._id, status);
            list = list.sort((a, b) => {
                return a.index - b.index;
            });
            if (list.length > 0) {
                item.list = list;
                newResult.push(item);
            }
        }
        return newResult;
    }

    handleExistId(data) {
        function delArrId(arr, fn) {
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                delete item._id;
                delete item.__v;
                delete item.uid;
                delete item.edit_uid;
                delete item.catid;
                delete item.project_id;

                if (typeof fn === 'function') fn(item);
            });
        }

        delArrId(data, function (item) {
            delArrId(item.list, function (api) {
                delArrId(api.req_body_form);
                delArrId(api.req_params);
                delArrId(api.req_query);
                delArrId(api.req_headers);
                if (api.query_path && typeof api.query_path === 'object') {
                    delArrId(api.query_path.params);
                }
            });
        });

        return data;
    }

    buildOpenAPI3Components(list) {
        const components = {
            schemas: {},
            responses: {},
            parameters: {},
            examples: {},
            requestBodies: {},
            headers: {},
            securitySchemes: {},
            links: {},
            callbacks: {}
        };

        // 从 openapi_raw 中提取 components 定义
        list.forEach(category => {
            category.list.forEach(api => {
                if (api.openapi_raw && api.openapi_raw.components) {
                    const rawComponents = api.openapi_raw.components;
                    Object.keys(rawComponents).forEach(componentType => {
                        if (components[componentType]) {
                            Object.assign(components[componentType], rawComponents[componentType]);
                        }
                    });
                }
            });
        });

        return components;
    }

    buildRequestBody(api) {
        if (api.req_body_type === 'json' && api.req_body_other) {
            try {
                const schema = JSON.parse(api.req_body_other);
                const requestBody = {
                    required: true,
                    content: {
                        'application/json': {
                            schema: schema
                        }
                    }
                };

                // 恢复 oneOf/anyOf/allOf 结构
                if (api.schema_composition) {
                    const composition = api.schema_composition;
                    requestBody.content['application/json'].schema = {
                        [composition.type]: composition.schemas
                    };

                    if (composition.discriminator) {
                        requestBody.content['application/json'].schema.discriminator = composition.discriminator;
                    }
                }

                return requestBody;
            } catch (e) {
                console.error('解析请求体 JSON 出错:', e);
            }
        } else if (api.req_body_type === 'form' && api.req_body_form.length > 0) {
            const properties = {};
            const required = [];

            api.req_body_form.forEach(formField => {
                properties[formField.name] = {
                    type: formField.type === 'file' ? 'string' : 'string',
                    description: formField.desc
                };
                
                if (formField.type === 'file') {
                    properties[formField.name].format = 'binary';
                }

                if (formField.required === '1') {
                    required.push(formField.name);
                }
            });

            return {
                required: required.length > 0,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: properties,
                            required: required
                        }
                    }
                }
            };
        }

        return null;
    }

    buildParameters(api) {
        const parameters = [];

        // Path parameters
        api.req_params.forEach(param => {
            parameters.push({
                name: param.name,
                in: 'path',
                required: true,
                description: param.desc,
                schema: {
                    type: 'string'
                },
                example: param.example
            });
        });

        // Query parameters
        api.req_query.forEach(param => {
            parameters.push({
                name: param.name,
                in: 'query',
                required: param.required === '1',
                description: param.desc,
                schema: {
                    type: 'string'
                },
                example: param.example
            });
        });

        // Header parameters
        api.req_headers.forEach(param => {
            if (param.name.toLowerCase() !== 'content-type') {
                parameters.push({
                    name: param.name,
                    in: 'header',
                    required: param.required === '1',
                    description: param.desc,
                    schema: {
                        type: 'string'
                    },
                    example: param.value || param.example
                });
            }
        });

        return parameters;
    }

    buildResponses(api) {
        const responses = {};
        
        if (api.res_body) {
            try {
                const schema = JSON.parse(api.res_body);
                
                // 检查是否包含 _yapiComposition 标记
                if (schema._yapiComposition) {
                    const composition = schema._yapiComposition;
                    delete schema._yapiComposition;
                    
                    responses['200'] = {
                        description: 'Successful operation',
                        content: {
                            'application/json': {
                                schema: {
                                    [composition.type]: composition.schemas
                                }
                            }
                        }
                    };

                    if (composition.discriminator) {
                        responses['200'].content['application/json'].schema.discriminator = composition.discriminator;
                    }
                } else {
                    responses['200'] = {
                        description: 'Successful operation',
                        content: {
                            'application/json': {
                                schema: schema
                            }
                        }
                    };
                }
            } catch (e) {
                responses['200'] = {
                    description: api.res_body || 'Successful operation'
                };
            }
        } else {
            responses['200'] = {
                description: 'Successful operation'
            };
        }

        // 添加常见错误响应
        responses['400'] = {
            description: 'Bad Request',
            content: {}
        };

        responses['500'] = {
            description: 'Internal Server Error',
            content: {}
        };

        return responses;
    }

    async exportData(ctx) {
        let pid = ctx.request.query.pid;
        let type = ctx.request.query.type;
        let status = ctx.request.query.status;

        if (!pid) {
            ctx.body = yapi.commons.resReturn(null, 200, 'pid 不能为空');
            return;
        }

        let curProject;
        let tp = '';

        try {
            curProject = await this.projectModel.get(pid);
            ctx.set('Content-Type', 'application/octet-stream');
            const list = await this.handleListClass(pid, status);

            switch (type) {
                case 'OpenAPIV3': {
                    let data = this.handleExistId(list);
                    let model = await this.convertToOpenAPI3Model(data, curProject);
                    tp = JSON.stringify(model, null, 2);
                    ctx.set('Content-Disposition', `attachment; filename=openapi3.json`);
                    return (ctx.body = tp);
                }
                default: {
                    ctx.body = yapi.commons.resReturn(null, 400, 'type 无效参数')
                }
            }
        } catch (error) {
            yapi.commons.log(error, 'error');
            ctx.body = yapi.commons.resReturn(null, 502, '导出出错');
        }
    }

    async convertToOpenAPI3Model(list, project) {
        const openapi3Obj = {
            openapi: project.openapi_version || '3.1.0',
            info: {
                title: project.name,
                version: '1.0.0',
                description: project.desc || ''
            },
            servers: [],
            paths: {},
            components: this.buildOpenAPI3Components(list),
            tags: []
        };

        // 设置 servers
        if (project.openapi_servers && project.openapi_servers.length > 0) {
            openapi3Obj.servers = project.openapi_servers;
        } else if (project.basepath) {
            openapi3Obj.servers = [{
                url: project.basepath,
                description: 'Default server'
            }];
        } else {
            openapi3Obj.servers = [{
                url: '/',
                description: 'Default server'
            }];
        }

        // 设置 webhooks
        if (project.webhooks) {
            openapi3Obj.webhooks = project.webhooks;
        }

        // 构建 tags
        const tagMap = new Map();
        list.forEach(category => {
            if (!tagMap.has(category.name)) {
                tagMap.set(category.name, {
                    name: category.name,
                    description: category.desc || category.name
                });
            }
        });
        openapi3Obj.tags = Array.from(tagMap.values());

        // 构建 paths
        const pathsObj = {};
        list.forEach(category => {
            category.list.forEach(api => {
                if (!pathsObj[api.path]) {
                    pathsObj[api.path] = {};
                }

                const operation = {
                    tags: [category.name],
                    summary: api.title,
                    description: api.markdown || api.desc,
                    deprecated: api.deprecated || false,
                    parameters: this.buildParameters(api),
                    responses: this.buildResponses(api)
                };

                // 添加 operationId
                if (api.openapi_raw && api.openapi_raw.operationId) {
                    operation.operationId = api.openapi_raw.operationId;
                } else {
                    operation.operationId = `${api.method.toLowerCase()}_${api.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
                }

                // 添加 requestBody
                const requestBody = this.buildRequestBody(api);
                if (requestBody) {
                    operation.requestBody = requestBody;
                }

                // 添加 callbacks
                if (api.callbacks) {
                    operation.callbacks = api.callbacks;
                }

                // 添加 links
                if (api.links) {
                    operation.links = api.links;
                }

                // 添加 security
                if (api.openapi_raw && api.openapi_raw.security) {
                    operation.security = api.openapi_raw.security;
                }

                pathsObj[api.path][api.method.toLowerCase()] = operation;
            });
        });

        openapi3Obj.paths = pathsObj;

        return openapi3Obj;
    }
}

module.exports = exportOpenAPI3Controller;