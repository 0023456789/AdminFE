import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  description?: string;
  showCreate?: boolean;
  onCreate?: () => void;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({
  description = 'Chưa có gói cước',
  showCreate,
  onCreate,
  showClearFilters,
  onClearFilters,
}: EmptyStateProps) {
  return (
    <Empty description={description}>
      {showCreate && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Tạo mới
        </Button>
      )}
      {showClearFilters && (
        <Button onClick={onClearFilters}>Xóa bộ lọc</Button>
      )}
    </Empty>
  );
}
