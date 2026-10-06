import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  Card, 
  Switch, 
  Space,
  Row,
  Col,
  message,
  Alert,
  Spin,
  Modal
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '../../components/PageHeader';
import { usePlanDetail } from './hooks/usePlans';
import { createPlan, updatePlan } from '../../api/plans';
import { planKeys } from '../../api/queryKeys';
import { toFormValues, toPayload, type PlanFormValues } from './utils/converters';
import { planRules } from './utils/rules';
import { BonusListField } from './components/BonusListField';
import { AppQuotaListField } from './components/AppQuotaListField';

export function Component() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(planId);
  const numericPlanId = Number(planId);

  const [form] = Form.useForm<PlanFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Block navigation if form is dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      Modal.confirm({
        title: 'Cảnh báo',
        content: 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?',
        okText: 'Rời khỏi',
        cancelText: 'Ở lại',
        onOk: () => blocker.proceed(),
        onCancel: () => blocker.reset(),
      });
    }
  }, [blocker]);

  
  const quotaType = Form.useWatch('quotaType', form);
  const cutoffPolicy = Form.useWatch('cutoffPolicy', form);

  const { data: plan, isLoading, isError } = usePlanDetail(numericPlanId);

  useEffect(() => {
    if (isEdit && plan) {
      form.setFieldsValue(toFormValues(plan));
    } else if (!isEdit) {
      form.setFieldsValue({
        durationMonths: 1,
        quotaType: 'DAILY',
        cutoffPolicy: 'DISCONNECT',
        isActive: true,
        voiceMinutes: 0,
        bonuses: [],
        appQuotas: [],
      });
    }
  }, [isEdit, plan, form]);

  const executeSave = async (values: PlanFormValues) => {
    setSubmitting(true);
    try {
      const payload = toPayload(values, isEdit);
      if (isEdit) {
        await updatePlan(numericPlanId, payload);
        message.success('Cập nhật gói cước thành công');
      } else {
        await createPlan(payload as any);
        message.success('Tạo gói cước thành công');
      }
      
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      navigate('/plans');
    } catch (error: any) {
      if (error?.isValidationError) {
        const formErrors = error.fieldErrors.map((e: any) => ({
          name: e.field,
          errors: [e.message]
        }));
        form.setFields(formErrors);
      } else {
        message.error(error?.message || 'Có lỗi xảy ra khi lưu gói cước');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (values: PlanFormValues) => {
    if (isEdit && plan) {
      const hadBonuses = plan.bonuses && plan.bonuses.length > 0;
      const hasNoBonuses = !values.bonuses || values.bonuses.length === 0;
      const willLoseBonuses = hadBonuses && hasNoBonuses;

      const hadApps = plan.appQuotas && plan.appQuotas.length > 0;
      const hasNoApps = !values.appQuotas || values.appQuotas.length === 0;
      const willLoseApps = hadApps && hasNoApps;

      if (willLoseBonuses || willLoseApps) {
        const messages = [];
        if (willLoseBonuses) messages.push('toàn bộ ưu đãi chu kỳ đầu');
        if (willLoseApps) messages.push('toàn bộ ưu đãi ứng dụng');
        
        Modal.confirm({
          title: 'Xác nhận lưu thay đổi',
          content: `Việc lưu này sẽ xóa ${messages.join(' và ')} của gói cước. Bạn có chắc chắn muốn tiếp tục?`,
          okText: 'Đồng ý lưu',
          cancelText: 'Hủy',
          okButtonProps: { danger: true },
          onOk: () => executeSave(values),
        });
        return;
      }
    }
    executeSave(values);
  };

  if (isEdit && isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  if (isEdit && isError) {
    return <Alert type="error" message="Không thể tải thông tin gói cước" showIcon />;
  }

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
                    onOk: () => navigate('/plans'),
                  });
                } else {
                  navigate('/plans');
                }
              }}
            />
            {isEdit ? 'Sửa gói cước' : 'Tạo gói cước mới'}
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
              <Form.Item label="Mã gói cước" name="code" rules={planRules.code}>
                <Input placeholder="VD: PLAN30" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tên gói cước" name="name" rules={planRules.name}>
                <Input placeholder="VD: Gói cước 30 ngày" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Giá cước (VNĐ)" name="price" rules={planRules.price}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thời hạn" name="durationMonths" rules={planRules.durationMonths}>
                <Select
                  options={[
                    { label: '1 tháng', value: 1 },
                    { label: '6 tháng', value: 6 },
                    { label: '12 tháng', value: 12 },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Dung lượng Data (MB)" name="dataQuotaMb" rules={planRules.dataQuotaMb}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại chu kỳ Data" name="quotaType" rules={planRules.quotaType}>
                <Select
                  options={[
                    { label: 'Cộng theo ngày (DAILY)', value: 'DAILY' },
                    { label: 'Cộng theo tháng (MONTHLY)', value: 'MONTHLY' },
                    { label: 'Cộng theo chu kỳ (PER_CYCLE)', value: 'PER_CYCLE' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Số ngày chu kỳ"
                name="cycleDays"
                rules={planRules.cycleDays(quotaType)}
                dependencies={['quotaType']}
              >
                <InputNumber style={{ width: '100%' }} min={1} disabled={quotaType !== 'PER_CYCLE'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phút gọi (tuỳ chọn)" name="voiceMinutes">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Chính sách khi hết Data" name="cutoffPolicy" rules={planRules.cutoffPolicy}>
                <Select
                  options={[
                    { label: 'Ngắt kết nối (DISCONNECT)', value: 'DISCONNECT' },
                    { label: 'Hạ băng thông (THROTTLE)', value: 'THROTTLE' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tốc độ hạ băng thông (Kbps)"
                name="throttleSpeedKbps"
                rules={planRules.throttleSpeedKbps(cutoffPolicy)}
                dependencies={['cutoffPolicy']}
              >
                <InputNumber style={{ width: '100%' }} min={1} disabled={cutoffPolicy !== 'THROTTLE'} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={4} placeholder="Mô tả chi tiết gói cước" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <BonusListField />
            </Col>
            <Col span={24}>
              <AppQuotaListField />
            </Col>

            {!isEdit && (
              <Col span={24}>
                <Form.Item label="Trạng thái kích hoạt" name="isActive" valuePropName="checked">
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              if (isDirty) {
                Modal.confirm({
                  title: 'Cảnh báo',
                  content: 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?',
                  okText: 'Rời khỏi',
                  cancelText: 'Ở lại',
                  onOk: () => navigate('/plans'),
                });
              } else {
                navigate('/plans');
              }
            }}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
            >
              {isEdit ? 'Lưu thay đổi' : 'Tạo gói cước'}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
