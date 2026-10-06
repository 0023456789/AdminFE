import React from 'react';
import { Form, Select, InputNumber, Button, Space, Card, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useActiveApps } from '../hooks/useApps';

export const AppQuotaListField: React.FC = () => {
  const { data: appsPage, isLoading } = useActiveApps();
  const apps = appsPage?.content || [];

  return (
    <Card title="Ưu đãi ứng dụng" size="small" style={{ marginBottom: 24 }}>
      <Form.List 
        name="appQuotas"
        rules={[
          {
            validator: async (_, quotas) => {
              if (!quotas) return;
              if (quotas.length > 50) throw new Error('Mỗi gói tối đa 50 ưu đãi ứng dụng');
              if (quotas.length < 2) return;
              const apps = quotas.map((q: any) => q?.appId).filter(Boolean);
              if (new Set(apps).size !== apps.length) {
                return Promise.reject(new Error('Các ứng dụng không được trùng nhau'));
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => {
          return (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8, flexWrap: 'wrap' }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'appId']}
                    rules={[{ required: true, message: 'Chọn ứng dụng' }]}
                  >
                    <Select
                      placeholder="Chọn ứng dụng"
                      style={{ width: 180 }}
                      loading={isLoading}
                      showSearch
                      optionFilterProp="label"
                      options={apps.map(app => ({
                        label: app.name || app.code,
                        value: app.id,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'quotaType']}
                    rules={[{ required: true, message: 'Chọn chu kỳ' }]}
                  >
                    <Select
                      placeholder="Chu kỳ"
                      style={{ width: 150 }}
                      options={[
                        { label: 'Theo ngày', value: 'DAILY' },
                        { label: 'Theo tháng', value: 'MONTHLY' },
                        { label: 'Theo chu kỳ gói', value: 'PER_CYCLE' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'quotaMb']}
                    rules={[
                      { required: true, message: 'Nhập dung lượng' },
                      { type: 'number', min: 1, message: 'Phải > 0' },
                      { type: 'integer', message: 'Dung lượng phải là số nguyên MB' },
                    ]}
                  >
                    <InputNumber placeholder="Dung lượng (MB)" style={{ width: 150 }} min={1} />
                  </Form.Item>

                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => remove(name)} 
                  />
                </Space>
              ))}

              {fields.length < 50 && (
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button 
                    type="dashed" 
                    onClick={() => add({ quotaType: 'DAILY', quotaMb: null })} 
                    block 
                    icon={<PlusOutlined />}
                    disabled={isLoading}
                  >
                    {isLoading ? <Spin size="small" /> : 'Thêm ứng dụng miễn phí (tối đa 50)'}
                  </Button>
                </Form.Item>
              )}
              <Form.ErrorList errors={errors} />
            </>
          );
        }}
      </Form.List>
    </Card>
  );
};
