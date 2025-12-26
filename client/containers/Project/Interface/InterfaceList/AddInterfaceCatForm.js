import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button, TreeSelect } from 'antd';

const buildTreeData = (list = []) =>
  list.map(item => ({
    title: item.name,
    value: `${item._id}`,
    key: `${item._id}`,
    children: buildTreeData(item.children || [])
  }));

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 }
  }
};

const AddInterfaceCatForm = ({ onSubmit, onCancel, catdata, catTree }) => {
  const [form] = Form.useForm();
  const nameValue = Form.useWatch('name', form);

  useEffect(() => {
    form.setFieldsValue({
      name: catdata ? catdata.name || null : null,
      desc: catdata ? catdata.desc || null : null,
      parent_id:
        catdata && typeof catdata.parent_id !== 'undefined'
          ? `${catdata.parent_id}`
          : '0'
    });
  }, [catdata, form]);

  const handleFinish = values => {
    const payload = { ...values, parent_id: Number(values.parent_id || 0) };
    onSubmit(payload);
  };

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      initialValues={{
        name: catdata ? catdata.name || null : null,
        desc: catdata ? catdata.desc || null : null,
        parent_id:
          catdata && typeof catdata.parent_id !== 'undefined'
            ? `${catdata.parent_id}`
            : '0'
      }}
    >
      <Form.Item
        {...formItemLayout}
        label="分类名"
        name="name"
        rules={[
          {
            required: true,
            message: '请输入分类名称!'
          }
        ]}
      >
        <Input placeholder="分类名称" />
      </Form.Item>
      <Form.Item {...formItemLayout} label="备注" name="desc">
        <Input placeholder="备注" />
      </Form.Item>
      <Form.Item {...formItemLayout} label="父级分类" name="parent_id">
        <TreeSelect
          allowClear
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          treeDefaultExpandAll
          treeData={[
            { title: '根分类', value: '0', key: 'root' },
            ...buildTreeData(catTree || [])
          ]}
        />
      </Form.Item>

      <Form.Item className="catModalfoot" wrapperCol={{ span: 24, offset: 8 }}>
        <Button onClick={onCancel} style={{ marginRight: '10px' }}>
          取消
        </Button>
        <Button type="primary" htmlType="submit" disabled={!nameValue}>
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};

AddInterfaceCatForm.propTypes = {
  catTree: PropTypes.array,
  catdata: PropTypes.object,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func
};

export default AddInterfaceCatForm;
