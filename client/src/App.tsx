import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthBootstrap } from '@/components/AuthBootstrap'
import { GuestRoute } from '@/components/GuestRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout, RoleRoute, StudentRoute } from '@/layout/AppLayout'
import { AdminPage } from '@/pages/AdminPage'
import { ApplyPage } from '@/pages/ApplyPage'
import { ContractPage } from '@/pages/ContractPage'
import { DailyPage } from '@/pages/DailyPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RoomChangePage } from '@/pages/RoomChangePage'

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route element={<StudentRoute />}>
              <Route path="apply" element={<ApplyPage />} />
              <Route path="room-change" element={<RoomChangePage />} />
              <Route path="contract" element={<ContractPage />} />
              <Route path="daily" element={<DailyPage />} />
            </Route>
            <Route element={<RoleRoute roles={['admin', 'staff', 'accountant']} />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
