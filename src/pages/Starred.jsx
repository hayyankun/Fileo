import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import FileCard from '../components/file/FileCard';

const Starred = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  const [starredFiles, setStarredFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchStarredFiles();
    }
  }, [user, isAuthenticated, navigate]);

  const fetchStarredFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_starred', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setStarredFiles(data || []);
    } catch (error) {
      console.error('Error fetching starred files:', error);
      showToast('Failed to load starred files', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromStarred = async (fileId) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_starred: false })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setStarredFiles(starredFiles.filter(file => file.id !== fileId));
      showToast('Removed from starred', 'success');
    } catch (error) {
      console.error('Error removing from starred:', error);
      showToast('Failed to remove from starred', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Starred Files</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : starredFiles.length === 0 ? (
        <EmptyState
          icon={<FiStar className="text-4xl" />}
          title="No starred files"
          description="Files you star will appear here for quick access"
          buttonText="Go to Dashboard"
          buttonAction={() => navigate('/dashboard')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {starredFiles.map(file => (
            <FileCard
              key={file.id}
              file={file}
              onStar={() => handleRemoveFromStarred(file.id)}
              isStarred={true}
              onDelete={() => {}}
              onRestore={() => {}}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Starred;
