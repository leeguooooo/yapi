import React, { PureComponent } from 'react';
import { Card, Tag, Collapse, Alert } from 'antd';
import PropTypes from 'prop-types';
import './OpenAPI3Schema.scss';

const { Panel } = Collapse;

class OpenAPI3SchemaViewer extends PureComponent {
  static propTypes = {
    schema: PropTypes.string,
    composition: PropTypes.object,
    title: PropTypes.string
  };

  static defaultProps = {
    title: 'Schema'
  };

  parseSchema = (schemaStr) => {
    try {
      return JSON.parse(schemaStr);
    } catch (e) {
      return null;
    }
  };

  renderComposition = (composition) => {
    if (!composition) return null;

    const { type, schemas, discriminator } = composition;
    
    return (
      <Card size="small" className="openapi3-composition">
        <div className="composition-header">
          <Tag color={type === 'oneOf' ? 'blue' : type === 'anyOf' ? 'green' : 'purple'}>
            {type}
          </Tag>
          {discriminator && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              discriminator: {discriminator.propertyName}
            </Tag>
          )}
        </div>
        
        <Collapse size="small" className="composition-schemas">
          {schemas && schemas.map((schema, index) => (
            <Panel 
              header={
                <span>
                  选项 {index + 1}
                  {schema.title && <Tag style={{ marginLeft: 8 }}>{schema.title}</Tag>}
                </span>
              } 
              key={index}
            >
              <pre className="schema-content">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </Panel>
          ))}
        </Collapse>
        
        {discriminator && discriminator.mapping && (
          <div className="discriminator-mapping">
            <h4>类型映射:</h4>
            <div className="mapping-list">
              {Object.keys(discriminator.mapping).map(key => (
                <Tag key={key} className="mapping-tag">
                  {key} → {discriminator.mapping[key]}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  render() {
    const { schema, composition, title } = this.props;
    const parsedSchema = this.parseSchema(schema);

    if (!parsedSchema && !composition) {
      return null;
    }

    return (
      <div className="openapi3-schema-viewer">
        {composition && composition.discriminator && (
          <Alert
            type="info"
            showIcon
            message="类型识别"
            description={`使用 ${composition.discriminator.propertyName} 字段进行类型识别`}
            style={{ marginBottom: 16 }}
          />
        )}
        
        {composition && this.renderComposition(composition)}
        
        {parsedSchema && !composition && (
          <Card title={title} size="small">
            <pre className="schema-content">
              {JSON.stringify(parsedSchema, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    );
  }
}

export default OpenAPI3SchemaViewer;