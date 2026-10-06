import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Typography,
  Modal,
  Card,
  Input,
  Select,
  Switch,
  Tooltip,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import type { App } from '../../api/types';
import {
  useApps,
  useDeleteApp,
  useToggleAppStatus,
  useAppUrlState,
} from './hooks/useApps';
import { AppFormModal } from './AppFormModal';
import { ErrorResult } from '../../components/ErrorResult';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { isApiError, getErrorMessage } from '../../lib/errors';
import { vi } from '../../i18n/vi';

const { Text } = Typography;
const { Option } = Select;

// Extract Status Switch pattern for App
const AppStatusSwitch: React.FC<{ id: number; name: string; isActive: boolean; disabled?: boolean }> = ({ id, name, isActive, disabled }) => {
  const { mutate, isPending, variables } = useToggleAppStatus();
  const isCurrentMutating = isPending && variables?.id === id;

  return (
    <Tooltip title={isActive ? 'Bấm để tắt' : 'Bấm để bật'}>
      <Switch
        checked={isActive}
        loading={isCurrentMutating}
        disabled={disabled || isCurrentMutating}
        onChange={(checked) => mutate({ id, name, isActive: checked })}
        checkedChildren="Bật"
        unCheckedChildren="Tắt"
        aria-label={`Kích hoạt ứng dụng ${name}`}
      />
    </Tooltip>
  );
};

export const AppListPage: React.FC = () => {
  const {
    params,
    raw,
    isFiltered,
    setKeyword,
    setIsActive,
    setPagination,
    setTableState,
    resetFilters,
  } = useAppUrlState();

  const { data, isLoading, isError, error, refetch, isFetching } = useApps(params);
  const deleteMutation = useDeleteApp();
  const toggleMutation = useToggleAppStatus();

  // Modals state
  const [conflictApp, setConflictApp] = useState<App | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);

  const getSortOrder = (field: string): 'ascend' | 'descend' | null => {
    if (raw.sort.startsWith(`${field},`)) {
      return raw.sort.endsWith(',asc') ? 'ascend' : 'descend';
    }
    return null;
  };

  const handleDelete = async (record: App) => {
    if (!record.id) return;
    try {
      await deleteMutation.mutateAsync({ id: record.id, name: record.name });
      if (data?.content && data.content.length <= 1 && raw.page > 0) {
        setPagination(raw.page - 1, raw.size);
      }
    } catch (err) {
      if (isApiError(err) && (err.code === 1111 || err.httpStatus === 409)) {
        setConflictApp(record);
      }
    }
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<App> | SorterResult<App>[],
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

  const columns: ColumnsType<App> = [
    {
      title: vi.apps.code,
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      sortOrder: getSortOrder('code'),
      render: (code: string) => (
        <Text strong style={{ fontFamily: 'monospace', letterSpacing: 0.5, color: '#1677ff' }}>
          {code}
        </Text>
      ),
    },
    {
      title: vi.apps.name,
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: getSortOrder('name'),
      render: (name: string) => <Text>{name}</Text>,
    },
    {
      title: vi.apps.status,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (_, record) => (
        <AppStatusSwitch
          id={record.id!}
          name={record.name ?? ''}
          isActive={Boolean(record.isActive)}
        />
      ),
    },
    {
      title: vi.apps.createdAt,
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      sortOrder: getSortOrder('createdAt'),
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: vi.apps.actions,
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => {
        const disableActionMsg = 'Chỉ được thao tác khi đã tắt ứng dụng';
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              title={record.isActive ? disableActionMsg : vi.common.edit}
              disabled={record.isActive}
              onClick={() => {
                setEditingApp(record);
                setFormModalOpen(true);
              }}
            />
            <Popconfirm
              title={vi.apps.deleteConfirm}
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
        title={vi.apps.title}
        subtitle={
          data?.totalElements !== undefined
            ? `Tổng số ${data.totalElements} ứng dụng`
            : 'Quản lý danh sách ứng dụng'
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              setEditingApp(null);
              setFormModalOpen(true);
            }}
          >
            {vi.apps.createTitle}
          </Button>
        }
      />

      <Card bodyStyle={{ padding: '16px 24px', marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              placeholder={vi.common.search}
              prefix={<SearchOutlined />}
              value={raw.keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder={vi.apps.status}
              value={raw.isActive === true ? 'true' : raw.isActive === false ? 'false' : undefined}
              onChange={(val) => setIsActive(val === 'true' ? true : val === 'false' ? false : undefined)}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="true">{vi.common.active}</Option>
              <Option value="false">{vi.common.inactive}</Option>
            </Select>
          </Space>
          {isFiltered && (
            <Button type="link" onClick={resetFilters}>
              {vi.plans.clearFilters || 'Xóa bộ lọc'}
            </Button>
          )}
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table<App>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} ứng dụng`,
          }}
          locale={{
            emptyText: isFiltered ? (
              <EmptyState
                description={vi.apps.noResults}
                showClearFilters
                onClearFilters={resetFilters}
              />
            ) : (
              <EmptyState
                description={vi.apps.noApps}
                showCreate
                onCreate={() => {
                  setEditingApp(null);
                  setFormModalOpen(true);
                }}
              />
            ),
          }}
        />
      </Card>

      <AppFormModal
        open={formModalOpen}
        app={editingApp}
        onClose={() => setFormModalOpen(false)}
      />

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Không thể xóa ứng dụng</span>
          </Space>
        }
        open={Boolean(conflictApp)}
        onCancel={() => setConflictApp(null)}
        footer={[
          <Button key="cancel" onClick={() => setConflictApp(null)}>
            {vi.common.cancel}
          </Button>,
          <Button
            key="deactivate"
            type="primary"
            danger
            loading={toggleMutation.isPending}
            onClick={async () => {
              if (conflictApp?.id) {
                await toggleMutation.mutateAsync({
                  id: conflictApp.id,
                  name: conflictApp.name,
                  isActive: false,
                });
                setConflictApp(null);
              }
            }}
          >
            {vi.apps.deactivate}
          </Button>,
        ]}
      >
        <p>{vi.apps.inUse}</p>
        {conflictApp && (
          <p>
            Ứng dụng: <Text strong>{conflictApp.name}</Text> (
            <Text code>{conflictApp.code}</Text>)
          </p>
        )}
      </Modal>
    </div>
  );
};

export const Component = AppListPage;
export default AppListPage;
