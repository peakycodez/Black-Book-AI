import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';

import routes from './routes';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { MotionConfig } from 'motion/react';
import { DreamverseCursor, DreamverseEnvironment } from '@/components/dreamverse';

const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <AuthProvider>
          <IntersectObserver />
          <DreamverseCursor />
          <div className="flex flex-col min-h-screen relative" dir="ltr">
            <DreamverseEnvironment />
            <main className="flex-grow relative z-10">
              <Routes>
              {routes.map((route, index) => {
                const element = route.public === false ? (
                  <AdminRouteGuard>{route.element}</AdminRouteGuard>
                ) : (
                  route.element
                );
                return (
                  <Route
                    key={index}
                    path={route.path}
                    element={element}
                  />
                );
              })}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </AuthProvider>
      </Router>
    </MotionConfig>
  );
};

export default App;
