import _ from 'underscore';

export function schemaTransformToTable(schema) {
  try {
    schema = checkJsonSchema(schema);
    let result = Schema(schema, 0);
    result = _.isArray(result) ? result : [result];
    return result;
  } catch (err) {
    console.log(err);
  }
}

export default { schemaTransformToTable };

let fieldNum = 1;

//  自动添加type
function checkJsonSchema(json) {
  let newJson = Object.assign({}, json);
  if (_.isUndefined(json.type) && _.isObject(json.properties)) {
    newJson.type = 'object';
  }

  return newJson;
}

const mapping = function(data, index) {
  switch (data.type) {
    case 'string':
      return SchemaString(data);

    case 'number':
      return SchemaNumber(data);

    case 'array':
      return SchemaArray(data, index);

    case 'object':
      return SchemaObject(data, index);

    case 'boolean':
      return SchemaBoolean(data);

    default:
      return SchemaCommon(data);
  }
};

function Schema(data, index) {
  const result = mapping(data, index);
  return result;
}

// 文档类型
function SchemaCommon(schema) {
  let value = '';
  if (schema.mock && typeof schema.mock === 'object') {
    value = schema.mock.mock;
  }
  if (schema.enum && Array.isArray(schema.enum) && schema.enum.length) {
    value = schema.enum.join('\n');
  }
  return {
    name: schema.name,
    desc: schema.description,
    type: schema.type ? schema.type.toLowerCase() : 'string',
    required: schema.required,
    value
  };
}

function SchemaString(schema) {
  return SchemaCommon(schema);
}

function SchemaNumber(schema) {
  return SchemaCommon(schema);
}

function SchemaBoolean(schema) {
  return SchemaCommon(schema);
}

function SchemaObject(schema, index) {
  let name = schema.name;
  if (_.isUndefined(schema.name)) {
    name = '结构体' + index;
  }

  fieldNum++;
  let params = [];

  if (schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      if (schema.properties[key]) {
        let obj = Object.assign({}, schema.properties[key]);
        obj.name = key;
        if (schema.required && schema.required.indexOf(obj.name) !== -1) {
          obj.required = true;
        }
        obj = Schema(obj, fieldNum);
        if (obj && typeof obj === 'object') {
          obj.required = obj.required ? '必须' : '非必须';
          params.push(obj);
        }
      }
    });
  }

  return {
    name: name,
    desc: schema.description,
    type: 'object',
    required: schema.required,
    params
  };
}

function SchemaArray(schema) {
  let params = [];

  if (Array.isArray(schema.items)) {
    schema.items.forEach((item, index) => {
      fieldNum++;
      item = Schema(item, fieldNum);
      if (item && typeof item === 'object') {
        item.required = item.required ? '必须' : '非必须';
        params.push(item);
      }
    });
  } else if (schema.items && typeof schema.items === 'object') {
    fieldNum++;
    let result = Schema(schema.items, fieldNum);
    if (result && typeof result === 'object') {
      result.required = result.required ? '必须' : '非必须';
      params.push(result);
    }
  }

  return {
    name: schema.name,
    desc: schema.description,
    type: 'array',
    required: schema.required,
    value: schema.enum && schema.enum.join('\n'),
    params
  };
}
