import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiUpload, FiGrid, FiSettings, FiRefreshCw } from 'react-icons/fi';
import FileCard from '../components/file/FileCard';
import StorageBar from '../components/dashboard/StorageBar';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import { STORAGE_BUCKET } from '../utils/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchFiles();
    }
  }, [user, sortBy, isAuthenticated, navigate, retryCount]);
  
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      // First check if the files table exists and has the expected columns
      const { data: columnCheck, error: columnError } = await supabase
        .from('files')
        .select('id, user_id, filename, created_at')
        .limit(1);
        
      if (columnError) {
        console.error('Error checking files table:', columnError);
        setFiles([]);
        showToast('Failed to access files database. Contact support.', 'error');
        return;
      }
      
      // Build a query based on available columns
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      // Add search filter if search query exists
      if (searchQuery) {
        query = query.ilike('filename', `%${searchQuery}%`);
      }

      // Add sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('filename', { ascending: true });
          break;
        case 'size':
          query = query.order('file_size', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      showToast('Failed to fetch files', 'error');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle starred status
  const toggleStarred = async (fileId) => {
    try {
      // First check if the is_starred column exists
      let columnExists = false;
      try {
        const { error: testError } = await supabase
          .from('files')
          .select('is_starred')
          .eq('id', fileId)
          .limit(1);
          
        columnExists = !testError;
      } catch (e) {
        console.error('Error checking for is_starred column:', e);
      }
      
      if (!columnExists) {
        showToast('Star functionality is not supported. Database schema needs upgrading.', 'error');
        return;
      }
      
      // Get current status
      const { data: currentFile, error: fetchError } = await supabase
        .from('files')
        .select('is_starred')
        .eq('id', fileId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const currentStatus = currentFile.is_starred;
      
      // Update to opposite status
      const { error } = await supabase
        .from('files')
        .update({ is_starred: !currentStatus })
        .eq('id', fileId);
        
      if (error) throw error;
      
      // Update local state
      setFiles(files.map(file => 
        file.id === fileId 
          ? { ...file, is_starred: !currentStatus } 
          : file
      ));
      
      showToast(
        !currentStatus ? 'File added to starred' : 'File removed from starred',
        'success'
      );
    } catch (error) {
      console.error('Error toggling starred status:', error);
      showToast('Failed to update file', 'error');
    }
  };
  
  // Move to trash
  const moveToTrash = async (fileId) => {
    try {
      // First check if the is_deleted column exists
      let columnExists = false;
      try {
        const { error: testError } = await supabase
          .from('files')
          .select('is_deleted')
          .eq('id', fileId)
          .limit(1);
          
        columnExists = !testError;
      } catch (e) {
        console.error('Error checking for is_deleted column:', e);
      }
      
      if (!columnExists) {
        showToast('Trash functionality is not supported. Database schema needs upgrading.', 'error');
        return;
      }
      
      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true })
        .eq('id', fileId);
        
      if (error) throw error;
      
      // Remove the file from the local state
      setFiles(files.filter(file => file.id !== fileId));
      
      showToast('File moved to trash', 'success');
    } catch (error) {
      console.error('Error moving file to trash:', error);
      showToast('Failed to move file to trash', 'error');
    }
  };

  // Handle search when pressing Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchFiles();
    }
  };

  // Retry loading if files fail to load
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] font-satoshi">
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 ml-0">
          <div className="max-w-6xl mx-auto pt-4">
            {/* Search and Sort Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="relative flex-1 max-w-lg w-full">
                <input
                  type="text"
                  placeholder="Search files by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="search-input w-full pl-12 pr-4"
                  aria-label="Search files"
                />
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#808080]" size={20} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown w-full md:w-auto"
                aria-label="Sort files"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">Size (Largest)</option>
              </select>
            </div>

            {/* Storage Overview */}
            <div className="mb-8">
              <StorageBar used={2.5} total={10} />
            </div>

            {/* Files Grid */}
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 bg-[#1A1A1A] rounded-2xl shadow-soft">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0084FF] mb-4"></div>
                <p className="text-[#A1A1A1] font-medium">Loading your files...</p>
              </div>
            ) : files.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {files.map((file) => (
                  <FileCard key={file.id} file={file} onDelete={fetchFiles} onToggleStarred={toggleStarred} onMoveToTrash={moveToTrash} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
              >
                {searchQuery ? (
                  <EmptyState
                    icon={<FiSearch className="w-16 h-16" />}
                    title="No matching files"
                    description={`No files found matching "${searchQuery}"`}
                    action={
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          fetchFiles();
                        }}
                        className="btn btn-secondary px-8 py-3"
                      >
                        Clear Search
                      </button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<FiUpload className="w-16 h-16" />}
                    title="No files yet"
                    description="Upload your first file to get started"
                    action={
                      <Link
                        to="/upload"
                        className="btn btn-secondary px-8 py-3"
                      >
                        <FiUpload className="mr-2" />
                        Upload Your First File
                      </Link>
                    }
                  />
                )}
              </motion.div>
            )}
            
            {/* Retry Button */}
            {!isLoading && files.length === 0 && !searchQuery && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white transition-colors"
                >
                  <FiRefreshCw className="text-lg" />
                  Refresh Files
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
