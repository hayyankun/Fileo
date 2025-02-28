import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import FileDetails from './pages/FileDetails';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Trash from './pages/Trash';
import Starred from './pages/Starred';
import Sharing from './pages/Sharing';

// Components
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Toast from './components/ui/Toast';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <SupabaseProvider>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-[#0D0D0D] text-[#F5F5F5]">
            <Navbar toggleSidebar={toggleSidebar} />
            <div className="flex">
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              <main className="flex-1 pt-16 transition-all duration-300">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } />
                    <Route path="/signup" element={
                      <PublicRoute>
                        <Signup />
                      </PublicRoute>
                    } />
                    <Route path="/dashboard" element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    } />
                    <Route path="/upload" element={
                      <PrivateRoute>
                        <Upload />
                      </PrivateRoute>
                    } />
                    <Route path="/file/:id" element={
                      <PrivateRoute>
                        <FileDetails />
                      </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                      <PrivateRoute>
                        <Settings />
                      </PrivateRoute>
                    } />
                    <Route path="/trash" element={
                      <PrivateRoute>
                        <Trash />
                      </PrivateRoute>
                    } />
                    <Route path="/starred" element={
                      <PrivateRoute>
                        <Starred />
                      </PrivateRoute>
                    } />
                    <Route path="/sharing" element={
                      <PrivateRoute>
                        <Sharing />
                      </PrivateRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatePresence>
              </main>
            </div>
            <Toaster position="top-right" />
            <Toast />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
}

export default App;
