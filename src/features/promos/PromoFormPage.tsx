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
import { parseFieldPath } from '../../lib/errors';

const MAX_VND = 999_999_999_999;
const PROMO_CODE_PATTERN = /^[A-Za-z0-9_-]{2,50}$/;

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

  const discountType = Form.useWatch('discountType', form);
  const appliesToAllPlans = Form.useWatch('appliesToAllPlans', form);
  const { data: promo, isLoading: isLoadingPromo, isError: isErrorPromo } = usePromoDetail(numericId);
  const {
    data: plansData,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    refetch: refetchPlans,
  } = usePlans({ page: 0, size: 100, sort: 'createdAt,desc' }, appliesToAllPlans === false);
  const createMutation = useCreatePromo();
  const updateMutation = useUpdatePromo();

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
      code: values.code.trim(),
      description: values.description?.trim() || null,
      validFrom: values.validFrom ? values.validFrom.toISOString() : undefined,
      validTo: values.validTo ? values.validTo.toISOString() : undefined,
      maxDiscountAmount: values.discountType === 'PERCENT' ? values.maxDiscountAmount ?? null : null,
      minOrderAmount: values.minOrderAmount ?? 0,
      planIds: values.appliesToAllPlans ? [] : values.planIds,
    };

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
          name: parseFieldPath(e.field || ''),
          errors: [e.message]
        }));
        form.setFields(formErrors);
        message.error(error.fieldErrors[0]?.message || error.message);
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
              <Form.Item label={vi.promos.code} name="code" rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập mã' },
                { transform: (value: string) => value?.trim(), pattern: PROMO_CODE_PATTERN, message: 'Mã gồm 2-50 ký tự chữ, số, gạch ngang hoặc gạch dưới' },
              ]}>
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
              <Form.Item label={vi.promos.discountValue} name="discountValue" rules={[
                { required: true, message: 'Vui lòng nhập giá trị' },
                { type: 'number', min: 0.01, message: 'Giá trị giảm phải lớn hơn 0' },
                { validator: (_, value) => {
                  if (value == null) return Promise.resolve();
                  if (discountType === 'PERCENT' && value > 100) return Promise.reject(new Error('Phần trăm giảm không được vượt quá 100%'));
                  if (discountType === 'FIXED_AMOUNT' && (!Number.isInteger(value) || value > MAX_VND)) return Promise.reject(new Error('Số tiền giảm phải là số nguyên không vượt quá 999.999.999.999 VNĐ'));
                  if (discountType === 'PERCENT' && Number(value.toFixed(2)) !== value) return Promise.reject(new Error('Phần trăm giảm tối đa 2 chữ số thập phân'));
                  return Promise.resolve();
                } },
              ]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  min={0.01}
                  max={discountType === 'PERCENT' ? 100 : MAX_VND}
                  precision={discountType === 'PERCENT' ? 2 : 0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {discountType === 'PERCENT' && (
                <Form.Item label={vi.promos.maxDiscountAmount} name="maxDiscountAmount" rules={[
                  { type: 'number', min: 0.01, max: MAX_VND, message: 'Giảm tối đa phải từ 1 đến 999.999.999.999 VNĐ' },
                  { type: 'integer', message: 'Giảm tối đa phải là số nguyên VNĐ' },
                ]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                    min={0.01}
                    max={MAX_VND}
                    precision={0}
                    placeholder="Không giới hạn nếu để trống"
                  />
                </Form.Item>
              )}
            </Col>

            <Col span={12}>
              <Form.Item label={vi.promos.minOrderAmount} name="minOrderAmount" rules={[
                { type: 'number', min: 0, max: MAX_VND, message: 'Đơn tối thiểu phải từ 0 đến 999.999.999.999 VNĐ' },
                { type: 'integer', message: 'Đơn tối thiểu phải là số nguyên VNĐ' },
              ]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                  max={MAX_VND}
                  precision={0}
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
                  <Form.Item label={vi.promos.validTo} name="validTo" dependencies={['validFrom']} rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const validFrom = getFieldValue('validFrom');
                        return !value || !validFrom || value.isAfter(validFrom)
                          ? Promise.resolve()
                          : Promise.reject(new Error('Thời điểm kết thúc phải sau thời điểm bắt đầu'));
                      },
                    }),
                  ]}>
                    <DatePicker style={{ width: '100%' }} showTime format="DD/MM/YYYY HH:mm" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              <Form.Item label={vi.promos.usageLimit} name="usageLimit" rules={[
                { type: 'number', min: 1, message: 'Giới hạn lượt dùng phải là số nguyên dương' },
                { type: 'integer', message: 'Giới hạn lượt dùng phải là số nguyên' },
                { validator: (_, value) => value == null || value >= (promo?.usedCount ?? 0)
                  ? Promise.resolve() : Promise.reject(new Error(`Không được thấp hơn số lượt đã dùng (${promo?.usedCount})`)) },
              ]}>
                <InputNumber style={{ width: '100%' }} min={1} precision={0} placeholder="Không giới hạn nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={vi.promos.maxUsesPerMsisdn} name="maxUsesPerMsisdn" rules={[
                { type: 'number', min: 1, message: 'Giới hạn theo thuê bao phải là số nguyên dương' },
                { type: 'integer', message: 'Giới hạn theo thuê bao phải là số nguyên' },
              ]}>
                <InputNumber style={{ width: '100%' }} min={1} precision={0} placeholder="Không giới hạn nếu để trống" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label={vi.promos.appliesToAllPlans} name="appliesToAllPlans" valuePropName="checked" rules={[{ required: true, message: 'Vui lòng chọn phạm vi áp dụng' }]}>
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
            
            {appliesToAllPlans === false && (
              <Col span={24}>
                <Form.Item label={vi.promos.planIds} name="planIds" rules={[{
                  validator: (_, value) => Array.isArray(value) && value.length > 0
                    ? Promise.resolve() : Promise.reject(new Error('Vui lòng chọn ít nhất 1 gói cước')),
                }]}>
                  <Select
                    mode="multiple"
                    placeholder="Chọn gói cước"
                    loading={isLoadingPlans}
                    notFoundContent={isPlansError ? 'Không tải được danh sách gói cước' : 'Không có gói cước'}
                    options={plansData?.content?.map(plan => ({
                      label: `${plan.name} (${plan.code})`,
                      value: plan.id,
                    })) ?? []}
                  />
                </Form.Item>
                {isPlansError && (
                  <Button type="link" onClick={() => refetchPlans()} style={{ paddingLeft: 0 }}>
                    Tải lại danh sách gói cước
                  </Button>
                )}
              </Col>
            )}

            <Col span={24}>
              <Form.Item label={vi.promos.description} name="description" rules={[{ max: 255, message: 'Mô tả tối đa 255 ký tự' }]}>
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
