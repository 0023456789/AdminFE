import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { NotFoundPage } from './components/NotFoundPage';
import { CHANGE_PASSWORD_PATH, RequireAuth, RequireWriter } from './components/AuthRoutes';
import { LoginPage } from './features/auth/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      // Trang riêng, ngoài layout: khi còn phải đổi mật khẩu ban đầu, menu và các API khác đều bị chặn (ADM-07).
      { path: CHANGE_PASSWORD_PATH.slice(1), lazy: () => import('./features/auth/ChangePasswordPage') },
      {
        element: <App />,
        children: [
          { index: true, element: <Navigate to="/plans" replace /> },
          { path: 'plans', lazy: () => import('./features/plans/PlanListPage') },
          { path: 'plans/:id', lazy: () => import('./features/plans/PlanDetailPage') },
          { path: 'apps', lazy: () => import('./features/apps/AppListPage') },
          { path: 'promos', lazy: () => import('./features/promos/PromoListPage') },
          { path: 'promos/:id', lazy: () => import('./features/promos/PromoDetailPage') },
          {
            element: <RequireWriter />,
            children: [
              { path: 'plans/new', lazy: () => import('./features/plans/PlanFormPage') },
              { path: 'plans/:planId/edit', lazy: () => import('./features/plans/PlanFormPage') },
              { path: 'promos/new', lazy: () => import('./features/promos/PromoFormPage') },
              { path: 'promos/:id/edit', lazy: () => import('./features/promos/PromoFormPage') },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
