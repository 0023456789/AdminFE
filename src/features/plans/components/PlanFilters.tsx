import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Space, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { vi } from '../../../i18n/vi';

export interface PlanFiltersProps {
  keyword: string;
  isActive: boolean | undefined;
  durationMonths: 1 | 6 | 12 | undefined;
  isFiltered: boolean;
  onKeywordChange: (value: string) => void;
  onActiveChange: (value: boolean | undefined) => void;
  onDurationChange: (value: 1 | 6 | 12 | undefined) => void;
  onReset: () => void;
}

export const PlanFilters: React.FC<PlanFiltersProps> = ({
  keyword,
  isActive,
  durationMonths,
  isFiltered,
  onKeywordChange,
  onActiveChange,
  onDurationChange,
  onReset,
}) => {
  // Local state for debounced search input
  const [localKeyword, setLocalKeyword] = useState(keyword);

  // Sync external keyword changes (e.g. browser back/forward or reset)
  useEffect(() => {
    setLocalKeyword(keyword);
  }, [keyword]);

  // Debounce keyword update by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localKeyword !== keyword) {
        onKeywordChange(localKeyword);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [localKeyword, keyword, onKeywordChange]);

  const statusOptions = [
    { label: vi.common.all, value: 'ALL' },
    { label: vi.common.active, value: 'true' },
    { label: vi.common.inactive, value: 'false' },
  ];

  const durationOptions = [
    { label: vi.common.all, value: 'ALL' },
    { label: vi.duration[1], value: 1 },
    { label: vi.duration[6], value: 6 },
    { label: vi.duration[12], value: 12 },
  ];

  const currentStatusValue =
    isActive === true ? 'true' : isActive === false ? 'false' : 'ALL';
  const currentDurationValue = durationMonths ?? 'ALL';

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space wrap size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap size="middle">
          {/* Keyword Search */}
          <Input
            placeholder="Tìm theo mã hoặc tên gói..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />

          {/* Status Filter */}
          <Space size="small">
            <span style={{ fontSize: 13, color: '#595959' }}>Trạng thái:</span>
            <Select
              value={currentStatusValue}
              onChange={(val) => {
                if (val === 'true') onActiveChange(true);
                else if (val === 'false') onActiveChange(false);
                else onActiveChange(undefined);
              }}
              options={statusOptions}
              style={{ width: 130 }}
            />
          </Space>

          {/* Duration Filter */}
          <Space size="small">
            <span style={{ fontSize: 13, color: '#595959' }}>Thời hạn:</span>
            <Select
              value={currentDurationValue}
              onChange={(val) => {
                if (val === 1 || val === 6 || val === 12) {
                  onDurationChange(val);
                } else {
                  onDurationChange(undefined);
                }
              }}
              options={durationOptions}
              style={{ width: 130 }}
            />
          </Space>
        </Space>

        {/* Clear Filters Button */}
        {isFiltered && (
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            {vi.plans.clearFilters}
          </Button>
        )}
      </Space>
    </Card>
  );
};
