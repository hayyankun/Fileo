import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';

const Trash = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchDeletedFiles();
    }
  }, [user, isAuthenticated, navigate]);

  const fetchDeletedFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedFiles(data || []);
    } catch (error) {
      console.error('Error fetching deleted files:', error);
      showToast('Failed to load trash items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFile = async (fileId) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', fileId);

      if (error) throw error;
      showToast('File restored successfully', 'success');
      fetchDeletedFiles();
    } catch (error) {
      console.error('Error restoring file:', error);
      showToast('Failed to restore file', 'error');
    }
  };

  const permanentlyDeleteFile = async (fileId, filePath) => {
    try {
      // First delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('fileo-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Then delete the database record
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      showToast('File permanently deleted', 'success');
      fetchDeletedFiles();
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      showToast('Failed to delete file', 'error');
    }
  };

  const emptyTrash = async () => {
    if (deletedFiles.length === 0) return;
    
    if (!confirm('Are you sure you want to permanently delete all files in trash? This action cannot be undone.')) {
      return;
    }

    try {
      // Get all file paths
      const filePaths = deletedFiles.map(file => file.file_path);
      
      // Delete all files from storage
      const { error: storageError } = await supabase.storage
        .from('fileo-files')
        .remove(filePaths);

      if (storageError) throw storageError;

      // Delete all records from database
      const fileIds = deletedFiles.map(file => file.id);
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .in('id', fileIds);

      if (dbError) throw dbError;

      showToast('Trash emptied successfully', 'success');
      setDeletedFiles([]);
    } catch (error) {
      console.error('Error emptying trash:', error);
      showToast('Failed to empty trash', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-inter">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Trash</h1>
        
        {deletedFiles.length > 0 && (
          <button
            onClick={emptyTrash}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-opacity-90 transition-all duration-200 flex items-center"
          >
            <FiTrash2 className="mr-2" />
            Empty Trash
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : deletedFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1A1A] rounded-xl overflow-hidden shadow-soft"
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white truncate">{file.filename}</h3>
                    <p className="text-sm text-[#A1A1A1] mt-1">
                      {new Date(file.deleted_at).toLocaleDateString()} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => restoreFile(file.id)}
                    className="px-3 py-2 bg-white text-black rounded-lg hover:bg-opacity-90 transition-all duration-200 text-sm flex items-center"
                  >
                    <FiRefreshCw className="mr-1" size={14} />
                    Restore
                  </button>
                  
                  <button
                    onClick={() => permanentlyDeleteFile(file.id, file.file_path)}
                    className="px-3 py-2 bg-black text-white rounded-lg hover:bg-opacity-80 transition-all duration-200 text-sm flex items-center"
                  >
                    <FiTrash2 className="mr-1" size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FiTrash2 className="w-16 h-16 text-[#808080]" />}
          title="Trash is empty"
          description="Items in trash will be automatically deleted after 30 days"
        />
      )}
    </div>
  );
};

export default Trash;
