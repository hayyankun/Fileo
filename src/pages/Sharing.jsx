import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShare2, FiLink, FiUsers, FiCopy } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import FileCard from '../components/file/FileCard';

const Sharing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchSharedFiles();
    }
  }, [user, isAuthenticated, navigate]);

  const fetchSharedFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_shared', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSharedFiles(data || []);
    } catch (error) {
      console.error('Error fetching shared files:', error);
      showToast('Failed to load shared files', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyShareLink = (fileId) => {
    const shareLink = `${window.location.origin}/share/${fileId}`;
    navigator.clipboard.writeText(shareLink);
    showToast('Share link copied to clipboard', 'success');
  };

  const handleStopSharing = async (fileId) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_shared: false })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSharedFiles(sharedFiles.filter(file => file.id !== fileId));
      showToast('Stopped sharing file', 'success');
    } catch (error) {
      console.error('Error stopping sharing:', error);
      showToast('Failed to stop sharing', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Shared Files</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : sharedFiles.length === 0 ? (
        <EmptyState
          icon={<FiShare2 className="text-4xl" />}
          title="No shared files"
          description="Files you share with others will appear here"
          buttonText="Go to Dashboard"
          buttonAction={() => navigate('/dashboard')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sharedFiles.map(file => (
            <div key={file.id} className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              <FileCard
                file={file}
                onStar={() => {}}
                isStarred={file.is_starred}
                onDelete={() => {}}
                onRestore={() => {}}
              />
              <div className="p-4 border-t border-[#333]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-medium">Share Options</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCopyShareLink(file.id)}
                    className="flex items-center space-x-2 text-[#A1A1A1] hover:text-white transition-colors w-full py-2"
                  >
                    <FiCopy className="text-lg" />
                    <span>Copy Share Link</span>
                  </button>
                  <button
                    onClick={() => handleStopSharing(file.id)}
                    className="flex items-center space-x-2 text-[#A1A1A1] hover:text-red-500 transition-colors w-full py-2"
                  >
                    <FiUsers className="text-lg" />
                    <span>Stop Sharing</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Sharing;
