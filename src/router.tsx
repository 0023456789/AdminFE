import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { NotFoundPage } from './components/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/plans" replace />,
      },
      {
        path: 'plans',
        lazy: () => import('./features/plans/PlanListPage'),
      },
      {
        path: 'plans/new',
        lazy: () => import('./features/plans/PlanFormPage'),
      },
      {
        path: 'plans/:id',
        lazy: () => import('./features/plans/PlanDetailPage'),
      },
      {
        path: 'plans/:planId/edit',
        lazy: () => import('./features/plans/PlanFormPage'),
      },
      {
        path: 'apps',
        lazy: () => import('./features/apps/AppListPage'),
      },
      {
        path: 'promos',
        lazy: () => import('./features/promos/PromoListPage'),
      },
      {
        path: 'promos/new',
        lazy: () => import('./features/promos/PromoFormPage'),
      },
      {
        path: 'promos/:id',
        lazy: () => import('./features/promos/PromoDetailPage'),
      },
      {
        path: 'promos/:id/edit',
        lazy: () => import('./features/promos/PromoFormPage'),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
