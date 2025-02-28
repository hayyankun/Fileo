import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { FiClock, FiAlertTriangle, FiX } from 'react-icons/fi';

const AutoDeleteNotification = () => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const checkFilesToDelete = async () => {
      try {
        // First check if the function exists
        const { data: funcCheck, error: funcError } = await supabase
          .from('pg_catalog.pg_proc')
          .select('proname')
          .eq('proname', 'get_files_to_be_deleted_soon')
          .single();
          
        if (funcError || !funcCheck) {
          console.log('Auto-delete function not yet available');
          return;
        }
        
        // Call the function to get files that will be deleted soon
        const { data, error } = await supabase.rpc(
          'get_files_to_be_deleted_soon',
          { user_id: user.id }
        );
        
        if (error) {
          console.error('Error checking files for deletion:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setFilesToDelete(data);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (err) {
        console.error('Error in auto-delete check:', err);
      }
    };
    
    // Check when component mounts
    checkFilesToDelete();
    
    // Check periodically (every 24 hours)
    const intervalId = setInterval(checkFilesToDelete, 1000 * 60 * 60 * 24);
    
    return () => clearInterval(intervalId);
  }, [user, supabase]);
  
  const dismissNotification = () => {
    setIsVisible(false);
  };
  
  if (!isVisible || filesToDelete.length === 0) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg shadow-lg overflow-hidden max-w-md">
          <div 
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-yellow-600 dark:text-yellow-500" size={20} />
              <span className="font-medium text-yellow-800 dark:text-yellow-300">
                {filesToDelete.length} file(s) will be auto-deleted soon
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 border-t border-yellow-300 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    The following files will be moved to trash soon. Files in trash for more than 30 days are automatically deleted.
                  </p>
                  <ul className="divide-y divide-yellow-200 dark:divide-yellow-800 max-h-60 overflow-y-auto">
                    {filesToDelete.map(file => (
                      <li key={file.id} className="py-2 flex justify-between items-center">
                        <span className="text-sm truncate flex-1">{file.filename}</span>
                        <span className="text-xs bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                          <FiClock size={12} />
                          <span>{file.days_left} days left</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AutoDeleteNotification;
