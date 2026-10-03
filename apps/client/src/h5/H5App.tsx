import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import H5Shell from './components/H5Shell';
import RoleGate from './components/RoleGate';
import CaregiverTasksPage from './pages/CaregiverTasksPage';
import CheckInPage from './pages/CheckInPage';
import CheckHistoryPage from './pages/CheckHistoryPage';
import FamilyHomePage from './pages/FamilyHomePage';
import FamilyDetailPage from './pages/FamilyDetailPage';
import type { RoleIdentity } from '../shared/api';
import { IdentityContext } from './identity';
import './h5.less';

export default function H5App() {
  const [identity, setIdentity] = useState<RoleIdentity>({
    role: 'caregiver',
    id: 'c1',
    name: '李护工',
  });
  const value = useMemo(() => ({ identity, setIdentity }), [identity]);

  return (
    <IdentityContext.Provider value={value}>
      <div className="h5-phone">
        <H5Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/h5/tasks" replace />} />

            {/* 护工 */}
            <Route path="/tasks" element={<CaregiverTasksPage />} />
            <Route path="/checkin/:elderId" element={<CheckInPage />} />
            <Route path="/history" element={<CheckHistoryPage />} />

            {/* 家属 */}
            <Route path="/family" element={<FamilyHomePage />} />
            <Route path="/family/:elderId" element={<FamilyDetailPage />} />

            <Route path="/role" element={<RoleGate />} />
            <Route path="*" element={<Navigate to="/h5/tasks" replace />} />
          </Routes>
        </H5Shell>
      </div>
    </IdentityContext.Provider>
  );
}
