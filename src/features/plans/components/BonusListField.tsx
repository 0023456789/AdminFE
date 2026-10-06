import React from 'react';
import { Form, Select, InputNumber, Button, Space, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export const BonusListField: React.FC = () => {
  return (
    <Card title="Ưu đãi chu kỳ đầu" size="small" style={{ marginBottom: 24 }}>
      <Form.List 
        name="bonuses"
        rules={[
          {
            validator: async (_, bonuses) => {
              if (!bonuses) return;
              if (bonuses.length > 2) throw new Error('Mỗi gói tối đa 2 ưu đãi chu kỳ đầu');
              if (bonuses.length < 2) return;
              const types = bonuses.map((b: any) => b?.bonusType).filter(Boolean);
              if (new Set(types).size !== types.length) {
                return Promise.reject(new Error('Các loại ưu đãi không được trùng nhau'));
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'bonusType']}
                  rules={[{ required: true, message: 'Chọn loại ưu đãi' }]}
                >
                  <Select
                    placeholder="Loại ưu đãi"
                    style={{ width: 150 }}
                    options={[
                      { label: 'Data (MB)', value: 'DATA_MB' },
                      { label: 'Phút gọi', value: 'VOICE_MIN' },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'amount']}
                  rules={[
                    { required: true, message: 'Nhập số lượng' },
                    { type: 'number', min: 1, message: 'Phải > 0' },
                  ]}
                >
                  <InputNumber placeholder="Số lượng" style={{ width: 150 }} min={1} />
                </Form.Item>
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => remove(name)} 
                />
              </Space>
            ))}
            {fields.length < 2 && (
              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="dashed" 
                  onClick={() => add({ bonusType: 'DATA_MB', amount: null })} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Thêm ưu đãi (tối đa 2)
                </Button>
              </Form.Item>
            )}
            <Form.ErrorList errors={errors} />
          </>
        )}
      </Form.List>
    </Card>
  );
};
