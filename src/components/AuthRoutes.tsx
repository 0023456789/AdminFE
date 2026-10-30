import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const CHANGE_PASSWORD_PATH = '/change-password';

export function RequireAuth() {
  const { token, passwordChangeRequired } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  // Chưa đổi mật khẩu ban đầu thì mọi API khác trả 403, nên đưa thẳng tới trang đổi mật khẩu (ADM-07).
  if (passwordChangeRequired && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }
  return <Outlet />;
}

export function RequireWriter() {
  const { canWrite } = useAuth();
  return canWrite ? <Outlet /> : <Navigate to="/plans" replace />;
}
