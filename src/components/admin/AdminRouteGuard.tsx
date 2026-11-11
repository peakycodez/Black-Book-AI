import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { DreamversePageLoader } from '@/components/dreamverse';

interface AdminRouteGuardProps {
  children: ReactNode;
}

/**
 * Route-level security guard for admin routes.
 * Blocks unauthenticated users, guest users, and non-admin authenticated users
 * before admin pages mount or execute administrative queries.
 */
export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <DreamversePageLoader statusText="Verifying authorization" />
      </div>
    );
  }

  // Unauthenticated visitors or guest mode users are redirected to landing page
  if (!isAuthenticated || !user || user.type === 'guest') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Authenticated users without admin role are redirected to workspace
  if (!isAdmin) {
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
}
