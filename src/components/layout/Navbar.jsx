import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FiGrid, FiSettings, FiLogOut, FiMenu, FiX, FiStar, FiTrash2, FiShare2 } from 'react-icons/fi';

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Don't show navbar on auth pages or if user is not authenticated
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  if (isAuthPage || !isAuthenticated) return null;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  // Expanded nav items - include Starred, Trash and Shared
  const navItems = [
    { to: '/dashboard', icon: <FiGrid className="text-xl" />, label: 'Dashboard' },
    { to: '/starred', icon: <FiStar className="text-xl" />, label: 'Starred' },
    { to: '/trash', icon: <FiTrash2 className="text-xl" />, label: 'Trash' },
    { to: '/sharing', icon: <FiShare2 className="text-xl" />, label: 'Shared' },
    { to: '/settings', icon: <FiSettings className="text-xl" />, label: 'Settings' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="mr-3 text-gray-400 hover:text-white p-2 rounded-lg"
            >
              <FiMenu size={24} />
            </button>
            
            {/* Logo and Brand */}
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Fileo" className="h-8 w-8" />
              <span className="text-[#F5F5F5] font-bold text-xl">Fileo</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === item.to
                    ? 'bg-[#333333] text-white'
                    : 'text-gray-300 hover:bg-[#333333] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-[#333333] hover:text-white rounded-lg transition-colors"
            >
              <FiLogOut className="text-xl" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-[#F5F5F5] p-2 rounded-lg hover:bg-[#333333]"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1A1A1A] shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-colors ${
                    location.pathname === item.to
                      ? 'bg-[#333333] text-white'
                      : 'text-gray-300 hover:bg-[#333333] hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-3 text-gray-300 hover:bg-[#333333] hover:text-white rounded-lg transition-colors w-full text-left"
              >
                <FiLogOut className="text-xl" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
