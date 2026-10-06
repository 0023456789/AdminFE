import React from 'react';
import { Switch } from 'antd';
import { useTogglePromoStatus } from '../hooks/usePromos';

interface PromoStatusSwitchProps {
  id: number;
  code: string;
  isActive: boolean;
}

export const PromoStatusSwitch: React.FC<PromoStatusSwitchProps> = ({ id, code, isActive }) => {
  const toggleMutation = useTogglePromoStatus();

  return (
    <Switch
      checked={isActive}
      loading={toggleMutation.isPending}
      onChange={(checked) => {
        toggleMutation.mutate({ id, code, isActive: checked });
      }}
    />
  );
};
