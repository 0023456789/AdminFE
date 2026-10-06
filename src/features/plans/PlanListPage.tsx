import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Typography,
  Modal,
  Card,
  Tooltip,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQueries } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';


import type { PlanSummary } from '../../api/types';
import { getPlan } from '../../api/plans';
import { planKeys } from '../../api/queryKeys';
import { useApps } from '../apps/hooks/useApps';
import { usePlans } from './hooks/usePlans';
import { usePlanUrlState } from '../../lib/urlState';
import { useDeletePlan, useTogglePlanStatus } from './hooks/usePlanMutations';
import { PlanFilters } from './components/PlanFilters';
import { PlanStatusSwitch } from './components/PlanStatusSwitch';
import { ErrorResult } from '../../components/ErrorResult';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { formatVND, formatDuration, formatQuotaDisplay } from '../../lib/format';
import { isApiError, getErrorMessage } from '../../lib/errors';
import { vi } from '../../i18n/vi';

const { Text } = Typography;

export const PlanListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    params,
    raw,
    isFiltered,
    setKeyword,
    setIsActive,
    setDuration,

    setPagination,
    setTableState,
    resetFilters,
  } = usePlanUrlState();

  const { data, isLoading, isError, error, refetch, isFetching } = usePlans(params);
  const listedPlans = data?.content ?? [];
  const planDetails = useQueries({
    queries: listedPlans.map((plan) => ({
      queryKey: planKeys.detail(plan.id!),
      queryFn: () => getPlan(plan.id!),
      enabled: Boolean(plan.id),
      staleTime: 60_000,
    })),
  });
  const appsQuery = useApps({ size: 100 });
  const inactiveAppIds = new Set(
    (appsQuery.data?.content ?? []).filter((app) => !app.isActive).map((app) => app.id),
  );
  const deleteMutation = useDeletePlan();
  const toggleMutation = useTogglePlanStatus();

  // State for 409 (1111: PLAN_IN_USE) modal
  const [conflictPlan, setConflictPlan] = useState<PlanSummary | null>(null);

  // Helper to determine active sortOrder on a column
  const getSortOrder = (field: string): 'ascend' | 'descend' | null => {
    if (raw.sort.startsWith(`${field},`)) {
      return raw.sort.endsWith(',asc') ? 'ascend' : 'descend';
    }
    return null;
  };

  const handleDelete = async (record: PlanSummary) => {
    if (!record.id) return;
    try {
      await deleteMutation.mutateAsync({ id: record.id, name: record.name });
      // If deleting the last item on a page > 0, navigate back one page
      if (data?.content && data.content.length <= 1 && raw.page > 0) {
        setPagination(raw.page - 1, raw.size);
      }
    } catch (err) {
      if (isApiError(err) && (err.code === 1111 || err.httpStatus === 409)) {
        setConflictPlan(record);
      }
    }
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<PlanSummary> | SorterResult<PlanSummary>[],
  ) => {
    // 1. Calculate new pagination
    const newPage = (pagination.current ?? 1) - 1;
    const newSize = pagination.pageSize ?? raw.size;

    // 2. Calculate new sort
    let newSort: string | undefined = undefined;
    if (!Array.isArray(sorter)) {
      if (sorter.field && sorter.order) {
        const fieldStr = String(sorter.field);
        const dir = sorter.order === 'ascend' ? 'asc' : 'desc';
        newSort = `${fieldStr},${dir}`;
      }
    }
    
    // We update everything at once to prevent React Router race conditions
    // where multiple setSearchParams calls overwrite each other.
    setTableState(newPage, newSize, newSort);
  };

  const columns: ColumnsType<PlanSummary> = [
    {
      title: vi.plans.code,
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      sortOrder: getSortOrder('code'),
      render: (code: string, record: PlanSummary) => {
        const detailIndex = listedPlans.findIndex((plan) => plan.id === record.id);
        const hasInactiveApp = (planDetails[detailIndex]?.data?.appQuotas ?? []).some(
          (quota) => quota.appId !== undefined && inactiveAppIds.has(quota.appId),
        );
        return (
          <Space size={6}>
            <Link to={`/plans/${record.id}`}>
              <Text strong style={{ fontFamily: 'monospace', letterSpacing: 0.5, color: '#1677ff' }}>
                {code}
              </Text>
            </Link>
            {hasInactiveApp && (
              <Tooltip title="Gói này còn ưu đãi cho ứng dụng đã tắt. Mở chi tiết gói để kiểm tra.">
                <WarningOutlined aria-label="Có ưu đãi cho ứng dụng đã tắt" style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: vi.plans.name,
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: getSortOrder('name'),
      render: (name: string) => <Text>{name}</Text>,
    },
    {
      title: vi.plans.price,
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      sorter: true,
      sortOrder: getSortOrder('price'),
      render: (price: number) => (
        <Text strong style={{ color: '#1677ff' }}>
          {formatVND(price)}
        </Text>
      ),
    },
    {
      title: vi.plans.duration,
      dataIndex: 'durationMonths',
      key: 'durationMonths',
      sorter: true,
      sortOrder: getSortOrder('durationMonths'),
      render: (months: number) => formatDuration(months),
    },
    {
      title: vi.plans.dataQuota,
      key: 'quota',
      render: (_, record) => (
        <Text>
          {formatQuotaDisplay(
            record.dataQuotaMb ?? 0,
            record.quotaType ?? 'DAILY',
            record.cycleDays
          )}
        </Text>
      ),
    },
    {
      title: vi.plans.status,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (_, record) => (
        <PlanStatusSwitch
          id={record.id!}
          name={record.name ?? ''}
          isActive={Boolean(record.isActive)}
        />
      ),
    },
    {
      title: vi.plans.actions,
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => {
        const disableActionMsg = 'Chỉ được thao tác khi đã tắt gói';
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              title={record.isActive ? disableActionMsg : vi.common.edit}
              disabled={record.isActive}
              onClick={() => navigate(`/plans/${record.id}/edit`)}
            />
            <Popconfirm
              title={vi.plans.deleteConfirm}
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
      {/* Page Header */}
      <PageHeader
        title={vi.plans.title}
        subtitle={
          data?.totalElements !== undefined
            ? `Tổng số ${data.totalElements} gói cước`
            : 'Quản lý danh sách và cấu hình gói cước'
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/plans/new')}
          >
            {vi.plans.createTitle}
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <PlanFilters
        keyword={raw.keyword}
        isActive={raw.isActive}
        durationMonths={raw.durationMonths}
        isFiltered={isFiltered}
        onKeywordChange={setKeyword}
        onActiveChange={setIsActive}
        onDurationChange={setDuration}
        onReset={resetFilters}
      />

      {/* Plans Table */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table<PlanSummary>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} gói`,
          }}
          locale={{
            emptyText: isFiltered ? (
              <EmptyState
                description={vi.plans.noResults}
                showClearFilters
                onClearFilters={resetFilters}
              />
            ) : (
              <EmptyState
                description={vi.plans.noPlans}
                showCreate
                onCreate={() => navigate('/plans/new')}
              />
            ),
          }}
        />
      </Card>

      {/* Conflict Modal when plan is in use (409 / 1111) */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Không thể xóa gói cước</span>
          </Space>
        }
        open={Boolean(conflictPlan)}
        onCancel={() => setConflictPlan(null)}
        footer={[
          <Button key="cancel" onClick={() => setConflictPlan(null)}>
            {vi.common.cancel}
          </Button>,
          <Button
            key="deactivate"
            type="primary"
            danger
            loading={toggleMutation.isPending}
            onClick={async () => {
              if (conflictPlan?.id) {
                await toggleMutation.mutateAsync({
                  id: conflictPlan.id,
                  name: conflictPlan.name,
                  isActive: false,
                });
                setConflictPlan(null);
              }
            }}
          >
            {vi.plans.deactivate}
          </Button>,
        ]}
      >
        <p>{vi.plans.inUse}</p>
        {conflictPlan && (
          <p>
            Gói cước: <Text strong>{conflictPlan.name}</Text> (
            <Text code>{conflictPlan.code}</Text>)
          </p>
        )}
      </Modal>
    </div>
  );
};

export const Component = PlanListPage;
export default PlanListPage;
