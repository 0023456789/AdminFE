import React, { useState } from 'react';
import { Table, Button, Space, Popconfirm, Typography, Card, Input, Select, Progress, Tag } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';

import type { Promo } from '../../api/types';
import { usePromos, useDeletePromo } from './hooks/usePromos';
import { usePromoUrlState } from './hooks/usePromoUrlState';
import { PromoStatusSwitch } from './components/PromoStatusSwitch';
import { ErrorResult } from '../../components/ErrorResult';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { formatVND } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';
import { vi } from '../../i18n/vi';

const { Text } = Typography;

export const PromoListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    params,
    raw,
    isFiltered,
    setKeyword,
    setIsActive,
    setTableState,
    resetFilters,
  } = usePromoUrlState();

  const { data, isLoading, isError, error, refetch, isFetching } = usePromos(params);
  const deleteMutation = useDeletePromo();

  const getSortOrder = (field: string): 'ascend' | 'descend' | null => {
    if (raw.sort.startsWith(`${field},`)) {
      return raw.sort.endsWith(',asc') ? 'ascend' : 'descend';
    }
    return null;
  };

  const handleDelete = async (record: Promo) => {
    if (!record.id) return;
    try {
      await deleteMutation.mutateAsync({ id: record.id, code: record.code ?? '' });
      if (data?.content && data.content.length <= 1 && raw.page > 0) {
        setTableState(raw.page - 1, raw.size, raw.sort);
      }
    } catch (err) {
      // Handled globally or can add specific error handling
    }
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Promo> | SorterResult<Promo>[],
  ) => {
    const newPage = (pagination.current ?? 1) - 1;
    const newSize = pagination.pageSize ?? raw.size;

    let newSort: string | undefined = undefined;
    if (!Array.isArray(sorter)) {
      if (sorter.field && sorter.order) {
        const fieldStr = String(sorter.field);
        const dir = sorter.order === 'ascend' ? 'asc' : 'desc';
        newSort = `${fieldStr},${dir}`;
      }
    }
    setTableState(newPage, newSize, newSort);
  };

  const columns: ColumnsType<Promo> = [
    {
      title: vi.promos.code,
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      sortOrder: getSortOrder('code'),
      render: (code: string, record: Promo) => (
        <Link to={`/promos/${record.id}`}>
          <Text strong style={{ fontFamily: 'monospace', letterSpacing: 0.5, color: '#1677ff' }}>
            {code}
          </Text>
        </Link>
      ),
    },
    {
      title: vi.promos.description,
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: vi.promos.discountValue,
      key: 'discountValue',
      render: (_, record) => (
        <Text strong style={{ color: '#52c41a' }}>
          {record.discountType === 'FIXED_AMOUNT'
            ? formatVND(record.discountValue ?? 0)
            : `${record.discountValue}%`}
        </Text>
      ),
    },
    {
      title: vi.promos.usedCount,
      key: 'usage',
      width: 150,
      render: (_, record) => {
        const used = record.usedCount ?? 0;
        const limit = record.usageLimit;
        if (!limit) {
          return <Text>{used} / &infin;</Text>;
        }
        const percent = Math.min(100, Math.round((used / limit) * 100));
        return (
          <div style={{ minWidth: 100 }}>
            <Progress percent={percent} size="small" format={() => `${used}/${limit}`} />
          </div>
        );
      },
    },
    {
      title: vi.promos.validTo,
      dataIndex: 'validTo',
      key: 'validTo',
      sorter: true,
      sortOrder: getSortOrder('validTo'),
      render: (validTo?: string) => {
        if (!validTo) return <Tag color="green">Vô thời hạn</Tag>;
        const isExpired = dayjs().isAfter(dayjs(validTo));
        return <Text type={isExpired ? 'danger' : undefined}>{dayjs(validTo).format('DD/MM/YYYY HH:mm')}</Text>;
      },
    },
    {
      title: vi.promos.isActive,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (_, record) => (
        <PromoStatusSwitch
          id={record.id!}
          code={record.code ?? ''}
          isActive={Boolean(record.isActive)}
        />
      ),
    },
    {
      title: vi.promos.actions,
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => {
        const disableActionMsg = 'Chỉ được thao tác khi đã tắt';
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              title={record.isActive ? disableActionMsg : vi.common.edit}
              disabled={record.isActive}
              onClick={() => navigate(`/promos/${record.id}/edit`)}
            />
            <Popconfirm
              title={vi.promos.deleteConfirm}
              okText={vi.common.delete}
              cancelText={vi.common.cancel}
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
              onConfirm={() => handleDelete(record)}
              disabled={record.isActive}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                title={record.isActive ? disableActionMsg : vi.common.delete}
                disabled={record.isActive}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  if (isError) {
    return <ErrorResult message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title={vi.promos.title}
        subtitle={
          data?.totalElements !== undefined
            ? `Tổng số ${data.totalElements} mã khuyến mãi`
            : 'Quản lý danh sách mã khuyến mãi'
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/promos/new')}
          >
            {vi.promos.createTitle}
          </Button>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Tìm kiếm mã, mô tả..."
            prefix={<SearchOutlined />}
            value={raw.keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Trạng thái"
            value={raw.isActive}
            onChange={setIsActive}
            style={{ width: 150 }}
            allowClear
            options={[
              { value: true, label: vi.common.active },
              { value: false, label: vi.common.inactive },
            ]}
          />
          {isFiltered && (
            <Button type="link" onClick={resetFilters}>
              {vi.plans.clearFilters}
            </Button>
          )}
        </Space>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table<Promo>
          columns={columns}
          dataSource={data?.content ?? []}
          rowKey="id"
          loading={isLoading || isFetching}
          onChange={handleTableChange}
          pagination={{
            current: raw.page + 1,
            pageSize: raw.size,
            total: data?.totalElements ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mã`,
          }}
          locale={{
            emptyText: isFiltered ? (
              <EmptyState
                description={vi.promos.noResults}
                showClearFilters
                onClearFilters={resetFilters}
              />
            ) : (
              <EmptyState
                description={vi.promos.noPromos}
                showCreate
                onCreate={() => navigate('/promos/new')}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export const Component = PromoListPage;
export default PromoListPage;
