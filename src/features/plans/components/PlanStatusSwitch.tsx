import React from 'react';
import { Switch, Tooltip } from 'antd';
import { useTogglePlanStatus } from '../hooks/usePlanMutations';

export interface PlanStatusSwitchProps {
  id: number;
  name: string;
  isActive: boolean;
  disabled?: boolean;
}

export const PlanStatusSwitch: React.FC<PlanStatusSwitchProps> = ({
  id,
  name,
  isActive,
  disabled = false,
}) => {
  const { mutate, isPending, variables } = useTogglePlanStatus();

  const isCurrentMutating = isPending && variables?.id === id;

  const handleChange = (checked: boolean) => {
    mutate({
      id,
      name,
      isActive: checked,
    });
  };

  return (
    <Tooltip title={isActive ? 'Bấm để tắt gói' : 'Bấm để kích hoạt gói'}>
      <Switch
        checked={isActive}
        loading={isCurrentMutating}
        disabled={disabled || isCurrentMutating}
        onChange={handleChange}
        checkedChildren="Bật"
        unCheckedChildren="Tắt"
        aria-label={`Kích hoạt gói cước ${name}`}
      />
    </Tooltip>
  );
};
