import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';
import type { Rule } from 'antd/es/form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AUTH_ERROR } from '../../api/auth';
import { getErrorMessage, isApiError } from '../../lib/errors';
import { passwordPolicyError } from './passwordPolicy';

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordPage() {
  const { username, passwordChangeRequired, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<ChangePasswordValues>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const newPasswordRules: Rule[] = [
    { required: true, message: 'Nhập mật khẩu mới' },
    ({ getFieldValue }) => ({
      validator: (_, value: string | undefined) => {
        if (!value) return Promise.resolve();
        const policyError = passwordPolicyError(value, username);
        if (policyError) return Promise.reject(new Error(policyError));
        if (value === getFieldValue('currentPassword')) {
          return Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại'));
        }
        return Promise.resolve();
      },
    }),
  ];

  const submit = async ({ currentPassword, newPassword }: ChangePasswordValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      message.success('Đã đổi mật khẩu');
      navigate('/plans', { replace: true });
    } catch (changeError) {
      if (isApiError(changeError) && changeError.hasCode(AUTH_ERROR.CURRENT_PASSWORD_INCORRECT)) {
        form.setFields([{ name: 'currentPassword', errors: ['Mật khẩu hiện tại không đúng'] }]);
      } else if (isApiError(changeError) && changeError.hasCode(AUTH_ERROR.PASSWORD_POLICY_INVALID)) {
        form.setFields([{ name: 'newPassword', errors: ['Mật khẩu mới chưa đạt yêu cầu'] }]);
      } else {
        setError(getErrorMessage(changeError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f7fa' }}>
      <Card style={{ width: 'min(100%, 420px)' }}>
        <Typography.Title level={3}>Đổi mật khẩu</Typography.Title>
        {passwordChangeRequired && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Bạn cần đổi mật khẩu ban đầu trước khi tiếp tục sử dụng AdminSky."
          />
        )}
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form<ChangePasswordValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="Mật khẩu hiện tại" name="currentPassword"
            rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}>
            <Input.Password autoComplete="current-password" autoFocus />
          </Form.Item>
          <Form.Item label="Mật khẩu mới" name="newPassword" dependencies={['currentPassword']} rules={newPasswordRules}
            extra="Ít nhất 10 ký tự, có cả chữ và số, khác tên đăng nhập.">
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Nhập lại mật khẩu mới" name="confirmPassword" dependencies={['newPassword']} rules={[
            { required: true, message: 'Nhập lại mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator: (_, value: string | undefined) => !value || value === getFieldValue('newPassword')
                ? Promise.resolve()
                : Promise.reject(new Error('Mật khẩu nhập lại không khớp')),
            }),
          ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" htmlType="submit" block loading={isSubmitting}>Đổi mật khẩu</Button>
            {passwordChangeRequired ? (
              <Button block onClick={() => { logout(); navigate('/login', { replace: true }); }}>Đăng xuất</Button>
            ) : (
              <Button block onClick={() => navigate(-1)}>Quay lại</Button>
            )}
          </Space>
        </Form>
      </Card>
    </main>
  );
}

export const Component = ChangePasswordPage;
