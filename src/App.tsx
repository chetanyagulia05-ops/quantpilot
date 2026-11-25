import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PortfolioProvider } from '@/context/PortfolioContext';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Markets from '@/pages/Markets';
import ChartLab from '@/pages/ChartLab';
import Portfolio from '@/pages/Portfolio';
import PaperTrading from '@/pages/PaperTrading';
import Research from '@/pages/Research';
import News from '@/pages/News';
import AIAssistant from '@/pages/AIAssistant';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/chart-lab" element={<ChartLab />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/paper-trading" element={<PaperTrading />} />
                <Route path="/research" element={<Research />} />
                <Route path="/news" element={<News />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
