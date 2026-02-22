import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DownlineManagePage } from './pages/DownlineManage';
import Registration from './pages/Registration';
import Landing from './pages/Landing';
import AgentJoinPage from './pages/AgentJoinPage';
import PackageManage from './pages/admin/PackageManage';
import PackageDetail from './pages/admin/PackageDetail';
import PackageForm from './pages/admin/PackageForm';
import DepartureManage from './pages/admin/DepartureManage';

import BookingList from './pages/admin/BookingList';
import BankAccounts from './pages/admin/BankAccounts';
import Invoices from './pages/admin/Invoices';
import RegistrationStatus from './pages/RegistrationStatus';
import AffiliateDashboard from './pages/AffiliateDashboard';
import CommissionManage from './pages/admin/CommissionManage';
import RoomingBoard from './pages/admin/RoomingBoard';
import LogisticsChecklist from './pages/admin/LogisticsChecklist';
import DocumentScanner from './pages/admin/DocumentScanner';
import { MasterDataPage } from './pages/admin/masters/MasterDataPage';

import { AgentDashboard } from './pages/AgentDashboard';
import { ProspectList } from './pages/ProspectList';
import { AgentJamaahView } from './pages/AgentJamaahView';
import { IncomingLeads } from './pages/IncomingLeads';
import { ResellerDashboard } from './pages/ResellerDashboard';
import { MarketingKitView } from './pages/MarketingKitView';
import { CabangApproval } from './pages/admin/CabangApproval';
import { MarketingKitManage } from './pages/admin/MarketingKitManage';
import { CabangJamaahView } from './pages/admin/CabangJamaahView';
import { AssignLead } from './pages/admin/AssignLead';
import { CabangPerformance } from './pages/admin/CabangPerformance';
import { AuditLogView } from './pages/admin/AuditLogView';

const DashboardRouter = () => {
  const { user } = useAuthStore();
  if (user?.role === 'agen') return <AgentDashboard />;
  if (user?.role === 'reseller') return <ResellerDashboard />;
  return <DashboardPage />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/join/:code" element={<AgentJoinPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRouter />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* New Sales & CRM Routes */}
          <Route path="/prospects" element={<ProtectedRoute allowedRoles={['agen', 'reseller']}><DashboardLayout><ProspectList /></DashboardLayout></ProtectedRoute>} />
          <Route path="/agent/leads" element={<ProtectedRoute allowedRoles={['agen']}><DashboardLayout><IncomingLeads /></DashboardLayout></ProtectedRoute>} />
          <Route path="/agent/jamaah" element={<ProtectedRoute allowedRoles={['agen']}><DashboardLayout><AgentJamaahView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/marketing-kit" element={<ProtectedRoute allowedRoles={['cabang', 'mitra', 'agen', 'reseller']}><DashboardLayout><MarketingKitView /></DashboardLayout></ProtectedRoute>} />

          <Route path="/cabang/approval" element={<ProtectedRoute allowedRoles={['cabang']}><DashboardLayout><CabangApproval /></DashboardLayout></ProtectedRoute>} />
          <Route path="/cabang/jamaah" element={<ProtectedRoute allowedRoles={['cabang']}><DashboardLayout><CabangJamaahView /></DashboardLayout></ProtectedRoute>} />
          <Route path="/cabang/marketing-kit" element={<ProtectedRoute allowedRoles={['cabang']}><DashboardLayout><MarketingKitManage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/cabang/assign-lead" element={<ProtectedRoute allowedRoles={['cabang', 'mitra']}><DashboardLayout><AssignLead /></DashboardLayout></ProtectedRoute>} />

          <Route path="/admin/performance" element={<ProtectedRoute allowedRoles={['pusat']}><DashboardLayout><CabangPerformance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['pusat']}><DashboardLayout><AuditLogView /></DashboardLayout></ProtectedRoute>} />

          <Route path="/downline" element={
            <ProtectedRoute allowedRoles={['pusat', 'cabang', 'mitra', 'agen']}>
              <DashboardLayout>
                <DownlineManagePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/packages" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <PackageManage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/packages/create" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <PackageForm />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/packages/:id/edit" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <PackageForm />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/packages/:id" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <PackageDetail />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/departures" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <DepartureManage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/bookings" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <BookingList />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/invoices" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <Invoices />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/bank-accounts" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <BankAccounts />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/status/:id" element={<RegistrationStatus />} />

          <Route path="/affiliate" element={
            <ProtectedRoute allowedRoles={['cabang', 'mitra', 'agen', 'reseller']}>
              <DashboardLayout>
                <AffiliateDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/commissions" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <CommissionManage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/logistics" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <LogisticsChecklist />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/rooming" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <RoomingBoard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/documents" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <DocumentScanner />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Master Data Routes */}
          <Route path="/admin/masters/hotels" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <MasterDataPage type="hotels" />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/masters/airlines" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <MasterDataPage type="airlines" />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/masters/airports" element={
            <ProtectedRoute allowedRoles={['pusat']}>
              <DashboardLayout>
                <MasterDataPage type="airports" />
              </DashboardLayout>
            </ProtectedRoute>
          } />


          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}


export default App;
