import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Select, Button, TreeSelect } from 'antd';

import constants from '../../../../constants/variable.js';
import { handleApiPath, nameLengthLimit, normalizeInterfacePath } from '../../../../common.js';

const HTTP_METHOD = constants.HTTP_METHOD;
const HTTP_METHOD_KEYS = Object.keys(HTTP_METHOD);

const Option = Select.Option;

const buildTreeData = (list = []) =>
  list.map(item => ({
    title: item.name,
    value: `${item._id}`,
    key: `${item._id}`,
    children: buildTreeData(item.children || [])
  }));

const getFirstCatId = list => {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  const first = list[0];
  return first ? first._id : undefined;
};

const AddInterfaceForm = ({ onSubmit, onCancel, catid, catdata, basepath }) => {
  const [form] = Form.useForm();

  const initialCatId = useMemo(() => {
    if (catid) return `${catid}`;
    const firstId = getFirstCatId(catdata);
    return typeof firstId !== 'undefined' ? `${firstId}` : undefined;
  }, [catdata, catid]);

  const initialValues = useMemo(
    () => ({
      catid: initialCatId,
      method: 'GET'
    }),
    [initialCatId]
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const catidValue = Form.useWatch('catid', form);
  const titleValue = Form.useWatch('title', form);
  const pathValue = Form.useWatch('path', form);

  const handleFinish = values => {
    const sanitizedPath = normalizeInterfacePath(basepath, values.path);
    const payload = {
      ...values,
      path: sanitizedPath
    };
    onSubmit(payload, () => {
      form.resetFields();
    });
  };

  const handlePathBlur = e => {
    const val = handleApiPath(e.target.value);
    form.setFieldsValue({
      path: val
    });
  };

  const prefixSelector = (
    <Form.Item name="method" noStyle>
      <Select style={{ width: 75 }}>
        {HTTP_METHOD_KEYS.map(item => {
          return (
            <Option key={item} value={item}>
              {item}
            </Option>
          );
        })}
      </Select>
    </Form.Item>
  );

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

  return (
    <Form form={form} onFinish={handleFinish} initialValues={initialValues}>
      <Form.Item
        {...formItemLayout}
        label="接口分类"
        name="catid"
        rules={[{ required: true, message: '请选择接口分类' }]}
      >
        <TreeSelect
          treeData={buildTreeData(catdata)}
          dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          placeholder="选择分类"
          treeDefaultExpandAll
        />
      </Form.Item>

      <Form.Item
        {...formItemLayout}
        label="接口名称"
        name="title"
        rules={nameLengthLimit('接口')}
      >
        <Input placeholder="接口名称" />
      </Form.Item>

      <Form.Item
        {...formItemLayout}
        label="接口路径"
        name="path"
        rules={[
          {
            required: true,
            message: '请输入接口路径!'
          }
        ]}
      >
        <Input onBlur={handlePathBlur} addonBefore={prefixSelector} placeholder="/path" />
      </Form.Item>

      <Form.Item {...formItemLayout} label="注">
        <span style={{ color: '#929292' }}>详细的接口数据可以在编辑页面中添加</span>
      </Form.Item>

      <Form.Item className="catModalfoot" wrapperCol={{ span: 24, offset: 8 }}>
        <Button onClick={onCancel} style={{ marginRight: '10px' }}>
          取消
        </Button>
        <Button
          type="primary"
          htmlType="submit"
        >
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};

AddInterfaceForm.propTypes = {
  catdata: PropTypes.array,
  catid: PropTypes.number,
  basepath: PropTypes.string,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func
};

export default AddInterfaceForm;
