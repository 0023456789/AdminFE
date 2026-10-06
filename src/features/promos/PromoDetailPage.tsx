import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Popconfirm, Spin, message, Row, Col, Progress } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { PageHeader } from '../../components/PageHeader';
import { ErrorResult } from '../../components/ErrorResult';
import { PromoStatusSwitch } from './components/PromoStatusSwitch';
import { PromoValidateTool } from './components/PromoValidateTool';
import { usePromoDetail, useDeletePromo } from './hooks/usePromos';
import { formatVND } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { vi } from '../../i18n/vi';

export const PromoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const promoId = Number(id);

  const { data: promo, isLoading, isError, error, refetch } = usePromoDetail(promoId);
  const deleteMutation = useDeletePromo();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!promo) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: promo.id!, code: promo.code! });
      navigate('/promos');
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra khi xóa mã khuyến mãi');
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

  if (isError || !promo) {
    return (
      <ErrorResult 
        message={error ? getErrorMessage(error) : vi.promos.noPromos} 
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
              onClick={() => navigate('/promos')}
            />
            Mã: {promo.code}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              disabled={promo.isActive}
              title={promo.isActive ? 'Chỉ được thao tác khi đã tắt' : vi.common.edit}
              onClick={() => navigate(`/promos/${promo.id}/edit`)}
            >
              {vi.common.edit}
            </Button>
            <Popconfirm
              title={vi.promos.deleteConfirm}
              okText={vi.common.delete}
              cancelText={vi.common.cancel}
              okButtonProps={{ danger: true, loading: isDeleting }}
              onConfirm={handleDelete}
              disabled={promo.isActive}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                disabled={promo.isActive}
                title={promo.isActive ? 'Chỉ được thao tác khi đã tắt' : vi.common.delete}
              >
                {vi.common.delete}
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      <Row gutter={16}>
        <Col span={16}>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions title="Thông tin cơ bản" column={2} bordered>
              <Descriptions.Item label={vi.promos.code}>{promo.code}</Descriptions.Item>
              <Descriptions.Item label={vi.promos.isActive}>
                <PromoStatusSwitch id={promo.id!} code={promo.code!} isActive={Boolean(promo.isActive)} />
              </Descriptions.Item>
              
              <Descriptions.Item label={vi.promos.discountType}>
                {promo.discountType === 'FIXED_AMOUNT' ? vi.promos.fixedAmount : vi.promos.percent}
              </Descriptions.Item>
              <Descriptions.Item label={vi.promos.discountValue}>
                <Tag color="green">
                  {promo.discountType === 'FIXED_AMOUNT'
                    ? formatVND(promo.discountValue ?? 0)
                    : `${promo.discountValue}%`}
                </Tag>
              </Descriptions.Item>

              {promo.discountType === 'PERCENT' && (
                <Descriptions.Item label={vi.promos.maxDiscountAmount}>
                  {promo.maxDiscountAmount ? formatVND(promo.maxDiscountAmount) : vi.promos.unlimited}
                </Descriptions.Item>
              )}

              <Descriptions.Item label={vi.promos.minOrderAmount}>
                {promo.minOrderAmount ? formatVND(promo.minOrderAmount) : 'Không yêu cầu'}
              </Descriptions.Item>

              <Descriptions.Item label={vi.promos.validFrom}>
                {promo.validFrom ? dayjs(promo.validFrom).format('DD/MM/YYYY HH:mm') : vi.promos.unlimited}
              </Descriptions.Item>
              <Descriptions.Item label={vi.promos.validTo}>
                {promo.validTo ? dayjs(promo.validTo).format('DD/MM/YYYY HH:mm') : vi.promos.unlimited}
              </Descriptions.Item>

              <Descriptions.Item label="Sử dụng" span={2}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span>Đã dùng {promo.usedCount ?? 0} {promo.usageLimit ? `/ ${promo.usageLimit}` : '(Không giới hạn)'}</span>
                  {promo.usageLimit && (
                    <Progress 
                      percent={Math.min(100, Math.round(((promo.usedCount ?? 0) / promo.usageLimit) * 100))} 
                      style={{ width: 200 }} 
                      size="small" 
                    />
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label={vi.promos.maxUsesPerMsisdn}>
                {promo.maxUsesPerMsisdn || vi.promos.unlimited}
              </Descriptions.Item>
              <Descriptions.Item label={vi.promos.appliesToAllPlans}>
                {promo.appliesToAllPlans ? (
                  <Tag color="blue">Tất cả gói cước</Tag>
                ) : (
                  <Space wrap>
                    {promo.planIds?.map(pid => (
                      <Tag key={pid}>ID: {pid}</Tag>
                    ))}
                  </Space>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={vi.promos.description} span={2}>
                {promo.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={8}>
          <PromoValidateTool />
        </Col>
      </Row>
    </div>
  );
};

export const Component = PromoDetailPage;
export default PromoDetailPage;
