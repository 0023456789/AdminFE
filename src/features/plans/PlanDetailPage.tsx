import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Popconfirm, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { PageHeader } from '../../components/PageHeader';
import { ErrorResult } from '../../components/ErrorResult';
import { PlanStatusSwitch } from './components/PlanStatusSwitch';
import { usePlanDetail } from './hooks/usePlans';
import { useDeletePlan } from './hooks/usePlanMutations';
import { formatVND, formatQuotaDisplay, formatDuration } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { vi } from '../../i18n/vi';

export const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const planId = Number(id);

  const { data: plan, isLoading, isError, error, refetch } = usePlanDetail(planId);
  const deleteMutation = useDeletePlan();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!plan) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: plan.id!, name: plan.name });
      navigate('/plans');
    } catch (err) {
      // Error handled by mutation (e.g. 409)
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <ErrorResult 
        message={error ? getErrorMessage(error) : 'Không tìm thấy gói cước'} 
        onRetry={() => refetch()} 
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/plans')}
            />
            {plan.name}
            <Tag color="blue" style={{ marginLeft: 8 }}>{plan.code}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              disabled={plan.isActive}
              title={plan.isActive ? 'Chỉ được thao tác khi đã tắt gói' : vi.common.edit}
              onClick={() => navigate(`/plans/${plan.id}/edit`)}
            >
              {vi.common.edit}
            </Button>
            <Popconfirm
              title={vi.plans.deleteConfirm}
              okText={vi.common.delete}
              cancelText={vi.common.cancel}
              okButtonProps={{ danger: true, loading: isDeleting }}
              onConfirm={handleDelete}
              disabled={plan.isActive}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                disabled={plan.isActive}
                title={plan.isActive ? 'Chỉ được thao tác khi đã tắt gói' : vi.common.delete}
              >
                {vi.common.delete}
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="Thông tin cơ bản" column={2} bordered>
          <Descriptions.Item label="Mã gói">{plan.code}</Descriptions.Item>
          <Descriptions.Item label="Tên gói">{plan.name}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <PlanStatusSwitch id={plan.id!} name={plan.name!} isActive={Boolean(plan.isActive)} />
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {plan.createdAt ? dayjs(plan.createdAt).format('DD/MM/YYYY HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Giá gói">{formatVND(plan.price ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Chu kỳ">{formatDuration(plan.durationMonths ?? 1)}</Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {plan.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Cấu hình dịch vụ">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Dung lượng Data">
            {formatQuotaDisplay(plan.dataQuotaMb ?? 0, plan.quotaType ?? 'DAILY', plan.cycleDays)}
          </Descriptions.Item>
          <Descriptions.Item label="Chính sách khi hết Data">
            {plan.cutoffPolicy === 'DISCONNECT' ? (
              <Tag color="error">{vi.plans.disconnect}</Tag>
            ) : (
              <Space>
                <Tag color="warning">{vi.plans.throttle}</Tag>
                {plan.throttleSpeedKbps ? `${plan.throttleSpeedKbps} Kbps` : ''}
              </Space>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label="Phút gọi miễn phí(theo chu kỳ)">
            {plan.voiceMinutes ? `${plan.voiceMinutes} phút` : '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Ưu đãi chu kỳ đầu">
            {plan.bonuses && plan.bonuses.length > 0 ? (
              <Space direction="vertical" size={2}>
                {plan.bonuses.map((bonus, idx) => (
                  <Tag key={idx} color="blue">
                    {bonus.bonusType === 'DATA_MB' ? `${bonus.amount} MB Data` : `${bonus.amount} phút gọi`}
                  </Tag>
                ))}
              </Space>
            ) : (
              <span style={{ color: '#bfbfbf' }}>Không có</span>
            )}
          </Descriptions.Item>

          {plan.appQuotas && plan.appQuotas.length > 0 && (
            <Descriptions.Item label="Ưu đãi ứng dụng" span={2}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {plan.appQuotas.map((app, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag color="cyan" style={{ minWidth: 80, textAlign: 'center' }}>
                      {app.appName || app.appCode || `App ID: ${app.appId}`}
                    </Tag>
                    <span style={{ color: '#595959' }}>
                      {app.quotaMb !== undefined && app.quotaType 
                        ? formatQuotaDisplay(app.quotaMb, app.quotaType, plan.cycleDays) 
                        : 'Không giới hạn'}
                    </span>
                  </div>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export const Component = PlanDetailPage;
export default PlanDetailPage;
