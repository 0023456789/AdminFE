import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Space, Typography, Spin } from 'antd';
import { useValidatePromo } from '../hooks/usePromos';
import { formatVND } from '../../../lib/format';
import type { PromoValidation } from '../../../api/types';

const { Text, Title } = Typography;

const REASON_CODES_VI: Record<string, string> = {
  NOT_FOUND: 'Không tìm thấy mã khuyến mãi',
  INACTIVE: 'Mã khuyến mãi đang tắt',
  NOT_STARTED: 'Mã khuyến mãi chưa tới thời gian bắt đầu',
  EXPIRED: 'Mã khuyến mãi đã hết hạn',
  EXHAUSTED: 'Mã khuyến mãi đã hết lượt sử dụng',
  USER_LIMIT_REACHED: 'Bạn đã hết lượt sử dụng mã này',
  NOT_APPLICABLE: 'Mã không áp dụng cho gói cước này',
  MIN_ORDER_NOT_MET: 'Chưa đạt giá trị đơn hàng tối thiểu',
};

interface ValidateFormValues {
  code: string;
  planId: string;
  msisdn?: string;
}

export const PromoValidateTool: React.FC = () => {
  const [form] = Form.useForm<ValidateFormValues>();
  const [result, setResult] = useState<PromoValidation | null>(null);
  const validateMutation = useValidatePromo();

  const handleFinish = async (values: ValidateFormValues) => {
    try {
      const res = await validateMutation.mutateAsync({
        code: values.code,
        planId: Number(values.planId),
        msisdn: values.msisdn,
      });
      setResult(res);
    } catch (error) {
      setResult(null);
    }
  };

  return (
    <Card title="Kiểm tra mã khuyến mãi" size="small">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item label="Mã khuyến mãi" name="code" rules={[{ required: true, message: 'Nhập mã khuyến mãi' }]}>
          <Input placeholder="Nhập mã..." />
        </Form.Item>
        <Form.Item label="Plan ID" name="planId" rules={[{ required: true, message: 'Nhập Plan ID' }]}>
          <Input placeholder="Ví dụ: 1, 2" />
        </Form.Item>
        <Form.Item label="Số điện thoại (Tuỳ chọn)" name="msisdn">
          <Input placeholder="Ví dụ: 09..." />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={validateMutation.isPending} block>
            Kiểm tra
          </Button>
        </Form.Item>
      </Form>

      {validateMutation.isPending && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Spin />
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          {result.valid ? (
            <Alert
              type="success"
              message="Mã hợp lệ"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text>Số tiền giảm:</Text>
                    <Text strong>{formatVND(result.discountAmount ?? 0)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text>Giá cuối cùng:</Text>
                    <Text strong type="success">{formatVND(result.finalPrice ?? 0)}</Text>
                  </div>
                </Space>
              }
              showIcon
            />
          ) : (
            <Alert
              type="error"
              message="Mã không hợp lệ"
              description={REASON_CODES_VI[result.reasonCode ?? ''] || result.reasonCode}
              showIcon
            />
          )}
        </div>
      )}
    </Card>
  );
};
