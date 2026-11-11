import Landing from './pages/Landing';
import Workspace from './pages/Workspace';
import SharedNote from './pages/SharedNote';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminNotesPage from './pages/admin/AdminNotesPage';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <Landing />,
    public: true,
  },
  {
    name: 'Workspace',
    path: '/workspace',
    element: <Workspace />,
    public: true,
  },
  {
    name: 'Shared Note',
    path: '/share/:id',
    element: <SharedNote />,
    public: true,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: <AdminDashboard />,
    public: false,
  },
  {
    name: 'Admin Users',
    path: '/admin/users',
    element: <AdminUsersPage />,
    public: false,
  },
  {
    name: 'Admin Notes',
    path: '/admin/notes',
    element: <AdminNotesPage />,
    public: false,
  },
];

export default routes;
