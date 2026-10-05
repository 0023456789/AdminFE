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
        path: 'plans/:planId/edit',
        lazy: () => import('./features/plans/PlanFormPage'),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
