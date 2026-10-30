import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { CHANGE_PASSWORD_PATH } from '../../components/AuthRoutes';

interface LoginValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async ({ username, password }: LoginValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { passwordChangeRequired } = await login(username, password);
      // Tài khoản còn mật khẩu ban đầu phải đổi trước khi vào các trang khác (ADM-07).
      const from = (location.state as { from?: string } | null)?.from ?? '/plans';
      navigate(passwordChangeRequired ? CHANGE_PASSWORD_PATH : from, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f7fa' }}>
      <Card style={{ width: 'min(100%, 420px)' }}>
        <Typography.Title level={3}>Đăng nhập AdminSky</Typography.Title>
        <Typography.Paragraph type="secondary">Dùng tài khoản nhân viên được cấp.</Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form<LoginValues> layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
            <Input autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={isSubmitting}>Đăng nhập</Button>
        </Form>
      </Card>
    </main>
  );
}

export const Component = LoginPage;
