import React, { useMemo } from 'react';
import { Form as AntForm } from 'antd';

function withLegacyForm(options = {}) {
  return WrappedComponent => props => {
    const [form] = AntForm.useForm();

    // Apply initialValues once
    useMemo(() => {
      if (options.mapPropsToFields) return;
      if (options.initialValues) {
        form.setFieldsValue(options.initialValues);
      }
    }, []);

    const legacyForm = {
      ...form,
      getFieldDecorator: (name, decoratorOpts = {}) => field => {
        const valueProp = decoratorOpts.valuePropName || 'value';
        const trigger = decoratorOpts.trigger || 'onChange';
        const normalize = decoratorOpts.normalize;
        const initial = decoratorOpts.initialValue;

        if (initial !== undefined && form.getFieldValue(name) === undefined) {
          form.setFieldsValue({ [name]: initial });
        }

        const currentValue = form.getFieldValue(name);

        const handleChange = e => {
          let next = e && e.target ? (valueProp === 'checked' ? e.target.checked : e.target.value) : e;
          if (normalize) next = normalize(next);
          form.setFieldsValue({ [name]: next });
          if (typeof field.props?.[trigger] === 'function') {
            field.props[trigger](e);
          }
        };

        const injectedProps = {
          [valueProp]: currentValue,
          [trigger]: handleChange
        };

        return React.cloneElement(field, injectedProps);
      },
      validateFields: async (names, callback) => {
        if (typeof names === 'function') {
          callback = names;
          names = undefined;
        }
        try {
          const values = await form.validateFields(names);
          callback && callback(null, values);
          return values;
        } catch (err) {
          callback && callback(err);
          throw err;
        }
      },
      validateFieldsAndScroll: async (names, callback) => {
        // Scroll behavior is handled by antd internally; we reuse validateFields for compatibility.
        return legacyForm.validateFields(names, callback);
      }
    };

    return (
      <AntForm form={form} component="div">
        <WrappedComponent {...props} form={legacyForm} />
      </AntForm>
    );
  };
}

// Expose a drop-in create() for legacy code
AntForm.create = opts => withLegacyForm(opts);

export const Form = AntForm;
export default AntForm;
