import { Button, Result } from 'antd';

interface ErrorResultProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorResult({ message, onRetry }: ErrorResultProps) {
  return (
    <Result
      status="error"
      title="Có lỗi xảy ra"
      subTitle={message ?? 'Không thể tải dữ liệu. Vui lòng thử lại.'}
      extra={
        onRetry && (
          <Button type="primary" onClick={onRetry}>
            Thử lại
          </Button>
        )
      }
    />
  );
}
