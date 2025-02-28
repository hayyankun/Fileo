import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUpload, FiSettings, FiShare2, FiClock, FiStar, FiTrash2, FiX } from 'react-icons/fi';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
      active
        ? 'bg-[#333333] text-white font-medium'
        : 'text-gray-400 hover:bg-[#333333] hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  // Navigation links configuration
  const navLinks = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/upload', icon: FiUpload, label: 'Upload Files' },
    { to: '/starred', icon: FiStar, label: 'Starred' },
    { to: '/trash', icon: FiTrash2, label: 'Trash' },
    { to: '/sharing', icon: FiShare2, label: 'Shared Files' },
    { to: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={toggleSidebar}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'tween' }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-[#1A1A1A] shadow-xl z-50 pt-16"
          >
            <div className="absolute top-4 right-4 md:hidden">
              <button 
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white p-2"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="h-full flex flex-col py-4">
              {/* User Profile Summary */}
              <div className="px-4 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#333333]">
                  <div className="w-10 h-10 rounded-full bg-[#555555] flex items-center justify-center text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate text-white">{user?.email || 'User'}</h3>
                  </div>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="flex-1 px-2 space-y-1">
                {navLinks.map((link, index) => (
                  <SidebarLink
                    key={index}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                    active={path === link.to}
                    onClick={toggleSidebar}
                  />
                ))}
              </div>
              
              {/* App Version */}
              <div className="px-4 pt-4 border-t border-[#333333]">
                <div className="text-xs text-gray-500">
                  Fileo v1.0.0
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
