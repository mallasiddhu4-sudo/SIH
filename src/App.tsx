import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { VoiceProvider } from './context/VoiceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProcurementProvider } from './context/ProcurementContext';
import { GenieProvider } from './context/GenieContext';

// Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { GenieAssistant } from './components/genie/GenieAssistant';
import { GuidanceOverlay } from './components/genie/GuidanceOverlay';

// Pages
import { LanguageSelectPage } from './pages/LanguageSelectPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/farmer/DashboardPage';
import { BookSlotPage } from './pages/farmer/BookSlotPage';
import { ManageSlotPage } from './pages/farmer/ManageSlotPage';
import { QueueStatusPage } from './pages/farmer/QueueStatusPage';
import { ProcurementPage } from './pages/farmer/ProcurementPage';
import { PaymentStatusPage } from './pages/farmer/PaymentStatusPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSimulationPage } from './pages/admin/AdminSimulationPage';
import { DepartmentDashboardPage } from './pages/admin/DepartmentDashboardPage';
import { CentreOperatorPage } from './pages/centre/CentreOperatorPage';
import { CentreIntelligencePage } from './pages/centre/CentreIntelligencePage';
import { PreArrivalPage } from './pages/farmer/PreArrivalPage';
import { MultiCropPlannerPage } from './pages/farmer/MultiCropPlannerPage';
import { CropInfoPage } from './pages/farmer/CropInfoPage';

// Route wrapper to ensure Language Selection always appears first on startup / fresh session
const RequireSessionLanguage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasSelectedLanguage } = useLanguage();
  const location = useLocation();

  // If user opens a fresh session at /login or /farmer/*, redirect to /language first
  if (!hasSelectedLanguage && location.pathname !== '/language' && location.pathname !== '/') {
    return <Navigate to="/language" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for pages that show Header & Footer
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLanguageSelect = location.pathname === '/language' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-warmgray-50 text-slate-900 selection:bg-agri-200">
      {!isLanguageSelect && <Header />}
      <div className="flex-1 flex flex-col">
        <RequireSessionLanguage>
          {children}
        </RequireSessionLanguage>
      </div>
      {!isLanguageSelect && <Footer />}

      {/* Floating Genie Assistant & Visual Guidance Overlay */}
      <GenieAssistant />
      <GuidanceOverlay />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <VoiceProvider>
        <AuthProvider>
          <ProcurementProvider>
            <BrowserRouter>
              <GenieProvider>
                <AppLayout>
                  <Routes>
                    {/* Root URL ALWAYS opens the Language Selection page first */}
                    <Route path="/" element={<LanguageSelectPage />} />
                    <Route path="/language" element={<LanguageSelectPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Farmer Pages */}
                    <Route path="/farmer/dashboard" element={<DashboardPage />} />
                    <Route path="/farmer/manage-slot" element={<ManageSlotPage />} />
                    <Route path="/farmer/book-slot" element={<BookSlotPage />} />
                    <Route path="/farmer/queue" element={<QueueStatusPage />} />
                    <Route path="/farmer/procurement" element={<ProcurementPage />} />
                    <Route path="/farmer/payment" element={<PaymentStatusPage />} />
                    <Route path="/farmer/pre-arrival" element={<PreArrivalPage />} />
                    <Route path="/farmer/multi-crop" element={<MultiCropPlannerPage />} />
                    <Route path="/farmer/crop-info" element={<CropInfoPage />} />

                    {/* Centre Pages */}
                    <Route path="/centre/dashboard" element={<CentreOperatorPage />} />
                    <Route path="/centre/intelligence" element={<CentreIntelligencePage />} />

                    {/* Admin Pages */}
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                    <Route path="/admin/simulation" element={<AdminSimulationPage />} />
                    <Route path="/admin/department" element={<DepartmentDashboardPage />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </GenieProvider>
            </BrowserRouter>
          </ProcurementProvider>
        </AuthProvider>
      </VoiceProvider>
    </LanguageProvider>
  );
}

export default App;

