import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

// Create a custom event for showing toasts
export const showToast = (message, type = 'success', duration = 4000) => {
  const event = new CustomEvent('showToast', {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};

const Toast = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleShowToast = (event) => {
      const { message, type, duration } = event.detail;
      setToast({ message, type, duration });

      // Auto-hide toast after duration
      const timer = setTimeout(() => {
        setToast(null);
      }, duration);

      return () => clearTimeout(timer);
    };

    // Add event listener
    window.addEventListener('showToast', handleShowToast);

    // Clean up event listener
    return () => window.removeEventListener('showToast', handleShowToast);
  }, []);

  // If no toast, don't render anything
  if (!toast) return null;

  // Determine icon based on toast type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FiCheckCircle className="text-green-500" size={24} />;
      case 'error':
        return <FiAlertCircle className="text-red-500" size={24} />;
      case 'info':
        return <FiInfo className="text-blue-500" size={24} />;
      default:
        return <FiInfo className="text-gray-500" size={24} />;
    }
  };

  // Get appropriate background color
  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-50 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`pointer-events-auto max-w-md w-full p-4 rounded-lg shadow-medium border flex items-center gap-3 ${getBgColor()}`}
          >
            {getIcon()}
            <p className="text-gray-700 dark:text-gray-200 flex-1">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
