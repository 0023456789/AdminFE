import { Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

export function Component() {
  const { planId } = useParams();
  const isEdit = Boolean(planId);

  return (
    <div>
      <Title level={4}>{isEdit ? 'Sửa gói cước' : 'Tạo gói cước'}</Title>
      <p>Form gói cước (sẽ triển khai ở F2)</p>
    </div>
  );
}
