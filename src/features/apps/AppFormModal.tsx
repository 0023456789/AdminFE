import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import type { App, AppCreateRequest } from '../../api/types';
import { useCreateApp, useUpdateApp } from './hooks/useApps';
import { vi } from '../../i18n/vi';
import { isApiError, parseFieldPath } from '../../lib/errors';

export interface AppFormModalProps {
  open: boolean;
  app: App | null; // null means create mode
  onClose: () => void;
}

export function AppFormModal({ open, app, onClose }: AppFormModalProps) {
  const [form] = Form.useForm();
  const isEdit = !!app;

  const createMutation = useCreateApp();
  const updateMutation = useUpdateApp();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (app) {
        form.setFieldsValue({
          code: app.code,
          name: app.name,
          isActive: app.isActive,
        });
      } else {
        form.setFieldsValue({
          code: '',
          name: '',
          isActive: true,
        });
      }
    } else {
      form.resetFields();
    }
  }, [open, app, form]);

  const handleSubmit = async (values: AppCreateRequest) => {
    try {
      if (isEdit && app?.id) {
        // AppUpdateRequest only needs code and name
        await updateMutation.mutateAsync({
          id: app.id,
          data: { code: values.code, name: values.name },
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      if (isApiError(err) && err.fieldErrors) {
        const fields = err.fieldErrors.map((fe) => ({
          name: parseFieldPath(fe.field || ''),
          errors: [fe.message || 'Lỗi'],
        }));
        form.setFields(fields as any);
      } else if (isApiError(err) && err.httpStatus === 409) {
        // Handle duplicate code or similar 409 error
        form.setFields([{ name: 'code', errors: [vi.apps.codeExists] }]);
      }
    }
  };

  return (
    <Modal
      title={isEdit ? vi.apps.editTitle : vi.apps.createTitle}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText={vi.common.save}
      cancelText={vi.common.cancel}
      maskClosable={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="code"
          label={vi.apps.code}
          rules={[
            { required: true, message: 'Vui lòng nhập mã ứng dụng' },
            { pattern: /^[A-Za-z0-9_]{2,50}$/, message: 'Mã không hợp lệ (2-50 ký tự, không dấu, không khoảng trắng)' }
          ]}
        >
          <Input placeholder="VD: FB, YOUTUBE..." />
        </Form.Item>
        <Form.Item
          name="name"
          label={vi.apps.name}
          rules={[
            { required: true, message: 'Vui lòng nhập tên ứng dụng' },
            { max: 100, message: 'Tên quá dài (tối đa 100 ký tự)' }
          ]}
        >
          <Input placeholder="VD: Facebook, Youtube..." />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            name="isActive"
            label={vi.apps.isActive}
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
