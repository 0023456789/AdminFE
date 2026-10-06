import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { 
  Form, Input, InputNumber, Select, Button, Card, Switch, Space, Row, Col, message, Alert, Spin, Modal, DatePicker
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { PageHeader } from '../../components/PageHeader';
import { usePromoDetail, useCreatePromo, useUpdatePromo } from './hooks/usePromos';
import { usePlans } from '../plans/hooks/usePlans';
import { vi } from '../../i18n/vi';

export function Component() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const numericId = Number(id);

  const [form] = Form.useForm();
  const [isDirty, setIsDirty] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      Modal.confirm({
        title: 'Cảnh báo',
        content: vi.plans.unsavedChanges || 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?',
        okText: 'Rời khỏi',
        cancelText: 'Ở lại',
        onOk: () => blocker.proceed(),
        onCancel: () => blocker.reset(),
      });
    }
  }, [blocker]);

  const { data: promo, isLoading: isLoadingPromo, isError: isErrorPromo } = usePromoDetail(numericId);
  const { data: plansData, isLoading: isLoadingPlans } = usePlans({ size: 1000 });
  const createMutation = useCreatePromo();
  const updateMutation = useUpdatePromo();

  const discountType = Form.useWatch('discountType', form);
  const appliesToAllPlans = Form.useWatch('appliesToAllPlans', form);

  useEffect(() => {
    if (isEdit && promo) {
      form.setFieldsValue({
        ...promo,
        validFrom: promo.validFrom ? dayjs(promo.validFrom) : undefined,
        validTo: promo.validTo ? dayjs(promo.validTo) : undefined,
      });
    } else if (!isEdit) {
      form.setFieldsValue({
        discountType: 'FIXED_AMOUNT',
        appliesToAllPlans: true,
        isActive: true,
      });
    }
  }, [isEdit, promo, form]);

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      validFrom: values.validFrom ? values.validFrom.toISOString() : undefined,
      validTo: values.validTo ? values.validTo.toISOString() : undefined,
    };

    if (payload.appliesToAllPlans) {
      payload.planIds = [];
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: numericId, body: payload });
        message.success(vi.promos.updateSuccess);
      } else {
        await createMutation.mutateAsync(payload);
        message.success(vi.promos.createSuccess);
      }
      setIsDirty(false);
      navigate('/promos');
    } catch (error: any) {
      if (error?.isValidationError) {
        const formErrors = error.fieldErrors.map((e: any) => ({
          name: e.field,
          errors: [e.message]
        }));
        form.setFields(formErrors);
      } else {
        message.error(error?.message || 'Có lỗi xảy ra khi lưu mã khuyến mãi');
      }
    }
  };

  if (isEdit && isLoadingPromo) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }
  if (isEdit && isErrorPromo) {
    return <Alert type="error" message="Không thể tải thông tin mã khuyến mãi" showIcon />;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (isDirty) {
                  Modal.confirm({
                    title: 'Cảnh báo',
                    content: 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?',
                    okText: 'Rời khỏi',
                    cancelText: 'Ở lại',
                    onOk: () => navigate('/promos'),
                  });
                } else {
                  navigate('/promos');
                }
              }}
            />
            {isEdit ? vi.promos.editTitle : vi.promos.createTitle}
          </Space>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={() => setIsDirty(true)}
          requiredMark="optional"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label={vi.promos.code} name="code" rules={[{ required: true, message: 'Vui lòng nhập mã' }]}>
                <Input placeholder="VD: VNSKY50" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={vi.promos.discountType} name="discountType" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: vi.promos.fixedAmount, value: 'FIXED_AMOUNT' },
                    { label: vi.promos.percent, value: 'PERCENT' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label={vi.promos.discountValue} name="discountValue" rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {discountType === 'PERCENT' && (
                <Form.Item label={vi.promos.maxDiscountAmount} name="maxDiscountAmount">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                    min={0}
                    placeholder="Không giới hạn nếu để trống"
                  />
                </Form.Item>
              )}
            </Col>

            <Col span={12}>
              <Form.Item label={vi.promos.minOrderAmount} name="minOrderAmount">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                  placeholder="Không yêu cầu nếu để trống"
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label={vi.promos.validFrom} name="validFrom">
                    <DatePicker style={{ width: '100%' }} showTime format="DD/MM/YYYY HH:mm" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={vi.promos.validTo} name="validTo">
                    <DatePicker style={{ width: '100%' }} showTime format="DD/MM/YYYY HH:mm" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              <Form.Item label={vi.promos.usageLimit} name="usageLimit">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="Không giới hạn nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={vi.promos.maxUsesPerMsisdn} name="maxUsesPerMsisdn">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="Không giới hạn nếu để trống" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label={vi.promos.appliesToAllPlans} name="appliesToAllPlans" valuePropName="checked">
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
            
            {!appliesToAllPlans && (
              <Col span={24}>
                <Form.Item label={vi.promos.planIds} name="planIds" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 gói cước' }]}>
                  <Select
                    mode="multiple"
                    placeholder="Chọn gói cước"
                    loading={isLoadingPlans}
                    options={plansData?.content?.map(plan => ({
                      label: `${plan.name} (${plan.code})`,
                      value: plan.id,
                    })) ?? []}
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={24}>
              <Form.Item label={vi.promos.description} name="description">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>

            {!isEdit && (
              <Col span={24}>
                <Form.Item label={vi.promos.isActive} name="isActive" valuePropName="checked">
                  <Switch checkedChildren={vi.common.active} unCheckedChildren={vi.common.inactive} />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/promos')}>{vi.common.cancel}</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
              {vi.common.save}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}

export default Component;
