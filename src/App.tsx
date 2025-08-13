import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QuizProvider } from '@/contexts/QuizContext';
import { ThemeProvider } from '@/components/theme-provider';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="toefl-theme-mode">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <QuizProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </QuizProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;