import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { I18nProvider } from '@/i18n/I18nContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppShell from '@/components/AppShell';
import Chat from '@/pages/Chat';
import Library from '@/pages/Library';
import Settings from '@/pages/Settings';
import WebSearch from '@/pages/WebSearch';
import DeepResearch from '@/pages/DeepResearch';
import WebsiteAnalyzer from '@/pages/WebsiteAnalyzer';
import InstagramAnalyzer from '@/pages/InstagramAnalyzer';
import TikTokAnalyzer from '@/pages/TikTokAnalyzer';
import FacebookAnalyzer from '@/pages/FacebookAnalyzer';
import Help from '@/pages/Help';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Terms from '@/pages/Terms';
import Support from '@/pages/Support';
import AdminTickets from '@/pages/AdminTickets';
import Admin from '@/pages/Admin';
import Tasks from '@/pages/Tasks';
import Projects from '@/pages/Projects';
import Explore from '@/pages/Explore';
import FileAnalysis from '@/pages/FileAnalysis';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import BugReport from '@/pages/BugReport';
import Security from '@/pages/Security';
import Pricing from '@/pages/Pricing';
import ErrorPage from '@/pages/ErrorPage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import ApiKeys from '@/pages/ApiKeys';
import ApiUsage from '@/pages/ApiUsage';
import ApiCredits from '@/pages/ApiCredits';
import ApiDocs from '@/pages/ApiDocs';
import ApiAccount from '@/pages/ApiAccount';
import ApiPlayground from '@/pages/ApiPlayground';
import Referral from '@/pages/Referral';
import PromptEditor from '@/pages/PromptEditor';
import Studio from '@/pages/Studio';
import Credits from '@/pages/Credits';
import Onboarding from '@/pages/Onboarding';
import Calendar from '@/pages/Calendar';
import Favorites from '@/pages/Favorites';
import Connectors from '@/pages/Connectors';
import Alarms from '@/pages/Alarms';

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/error" element={<ErrorPage />} />
                <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route element={<AppShell />}>
                    <Route path="/" element={<Navigate to="/chat/new" replace />} />
                    <Route path="/chat/:id" element={<Chat />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/upgrade" element={<ComingSoonPage titleKey="upgrade" />} />
                    <Route path="/web-search" element={<WebSearch />} />
                    <Route path="/deep-research" element={<DeepResearch />} />
                    <Route path="/website-analyzer" element={<WebsiteAnalyzer />} />
                    <Route path="/instagram-analyzer" element={<InstagramAnalyzer />} />
                    <Route path="/tiktok-analyzer" element={<TikTokAnalyzer />} />
                    <Route path="/facebook-analyzer" element={<FacebookAnalyzer />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/bug-report" element={<BugReport />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/admin/tickets" element={<AdminTickets />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/files" element={<FileAnalysis />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/developer/keys" element={<ApiKeys />} />
                    <Route path="/developer/usage" element={<ApiUsage />} />
                    <Route path="/developer/credits" element={<ApiCredits />} />
                    <Route path="/developer/docs" element={<ApiDocs />} />
                    <Route path="/developer/account" element={<ApiAccount />} />
                    <Route path="/developer/playground" element={<ApiPlayground />} />
                    <Route path="/referral" element={<Referral />} />
                    <Route path="/prompt-editor" element={<PromptEditor />} />
                    <Route path="/studio" element={<Studio />} />
                    <Route path="/credits" element={<Credits />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/connectors" element={<Connectors />} />
                    <Route path="/alarms" element={<Alarms />} />
                  </Route>
                </Route>
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;