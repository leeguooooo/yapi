import React, { useMemo, useRef } from 'react';
import { Form as AntForm } from 'antd';

function withLegacyForm(options = {}) {
  return WrappedComponent => props => {
    const [form] = AntForm.useForm();
    const fieldStoreRef = useRef({});

    // Apply initialValues once
    useMemo(() => {
      if (options.mapPropsToFields) return;
      if (options.initialValues) {
        form.setFieldsValue(options.initialValues);
        fieldStoreRef.current = { ...fieldStoreRef.current, ...options.initialValues };
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
          fieldStoreRef.current[name] = initial;
        }

        const currentValue = fieldStoreRef.current[name];

        const handleChange = e => {
          let next = e && e.target ? (valueProp === 'checked' ? e.target.checked : e.target.value) : e;
          if (normalize) next = normalize(next);
          fieldStoreRef.current[name] = next;
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
      getFieldsValue: names => {
        if (Array.isArray(names)) {
          const result = {};
          names.forEach(n => {
            result[n] = fieldStoreRef.current[n];
          });
          return result;
        }
        return { ...fieldStoreRef.current };
      },
      validateFields: async (names, callback) => {
        if (typeof names === 'function') {
          callback = names;
          names = undefined;
        }
        const values = legacyForm.getFieldsValue(names);
        const hasEmpty =
          Object.keys(values).length === 0 ||
          Object.values(values).some(v => v === undefined || v === null || v === '');
        const err = hasEmpty ? new Error('missing required fields') : null;
        callback && callback(err, values);
        if (err) throw err;
        return values;
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
