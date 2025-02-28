import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSupabase } from '../../contexts/SupabaseContext';
import { showToast } from '../ui/Toast';
import { 
  FiFile, FiImage, FiFileText, FiDownload, FiShare2, 
  FiTrash2, FiMoreVertical, FiEdit, FiClock
} from 'react-icons/fi';
import { STORAGE_BUCKET } from '../../utils/supabaseClient';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Helper to get file icon
const getFileIcon = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return <FiImage size={24} />;
  } else if (['doc', 'docx', 'txt', 'pdf', 'md', 'rtf'].includes(extension)) {
    return <FiFileText size={24} />;
  } else {
    return <FiFile size={24} />;
  }
};

const FileCard = ({ file, viewMode = 'grid', onDelete, onToggleStarred, onMoveToTrash }) => {
  const { supabase } = useSupabase();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(file.file_path);
        
      if (error) throw error;
      
      // Create a URL for the blob and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Download started', 'success');
    } catch (error) {
      console.error('Error downloading file:', error.message);
      showToast(`Download failed: ${error.message}`, 'error');
    }
  };
  
  // Handle permanent delete or soft delete (move to trash)
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // If we have the trash functionality, use it
      if (typeof onMoveToTrash === 'function') {
        await onMoveToTrash(file.id);
      } else {
        // Fall back to permanent delete
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([file.file_path]);
          
        if (error) throw error;
        
        // Delete the database record
        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', file.id);
          
        if (dbError) throw dbError;
        
        showToast('File deleted successfully', 'success');
      }
      
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast(`Failed to delete file: ${error.message}`, 'error');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };
  
  // Handle toggling starred status
  const handleToggleStar = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof onToggleStarred === 'function') {
      await onToggleStarred(file.id, file.is_starred || false);
    } else {
      showToast('Starring files is not supported in this view', 'info');
    }
    
    setShowMenu(false);
  };

  // Determine if the file is an image that can be previewed
  const isPreviewableImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    file.filename.split('.').pop().toLowerCase()
  );
  
  // Grid view card
  if (viewMode === 'grid') {
    return (
      <motion.div 
        whileHover={{ y: -5 }}
        className="file-card relative overflow-hidden group font-inter"
      >
        {/* File Preview */}
        <div className="aspect-square mb-3 bg-[#222] rounded-xl flex items-center justify-center overflow-hidden">
          {isPreviewableImage && file.file_url ? (
            <img 
              src={file.file_url} 
              alt={file.filename}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="text-white">
              {getFileIcon(file.filename)}
            </div>
          )}
        </div>
        
        {/* File Info */}
        <div>
          <h3 className="font-medium truncate text-white">{file.filename}</h3>
          <div className="text-sm text-[#A1A1A1] mt-1 flex items-center justify-between">
            <span>{formatFileSize(file.size)}</span>
            <span className="flex items-center gap-1">
              <FiClock size={14} />
              {formatDate(file.created_at)}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
          <Link
            to={`/file/${file.id}`}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="View Details"
          >
            <FiEdit size={18} />
          </Link>
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Download"
          >
            <FiDownload size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Move to Trash"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-t-2 border-r-2 border-black rounded-full animate-spin"></div>
            ) : (
              <FiTrash2 size={18} />
            )}
          </button>
        </div>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-2 top-10 bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 z-10 min-w-[180px]">
            <Link 
              to={`/file/${file.id}`}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiEdit size={16} />
              <span>Details</span>
            </Link>
            
            <button 
              onClick={handleDownload}
              className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiDownload size={16} />
              <span>Download</span>
            </button>
            
            <button 
              onClick={handleToggleStar}
              className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className={`fi fi-star ${file.is_starred ? 'text-yellow-400' : ''}`}></span>
              <span>{file.is_starred ? 'Unstar' : 'Star'}</span>
            </button>
            
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
            >
              <FiTrash2 size={16} />
              <span>{typeof onMoveToTrash === 'function' ? 'Move to Trash' : 'Delete'}</span>
            </button>
          </div>
        )}
      </motion.div>
    );
  }
  
  // List view row
  return (
    <motion.div 
      className="file-card flex items-center justify-between p-4 hover:bg-[#222] font-inter rounded-xl"
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="p-3 bg-[#222] rounded-md flex items-center justify-center">
          {getFileIcon(file.filename)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate text-white">{file.filename}</h3>
          <div className="text-sm text-[#A1A1A1] mt-1">
            {formatFileSize(file.size)} • {formatDate(file.created_at)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Link
          to={`/file/${file.id}`}
          className="p-2 rounded-full hover:bg-[#333] transition-colors"
          title="View Details"
        >
          <FiEdit size={18} className="text-white" />
        </Link>
        <button
          onClick={handleDownload}
          className="p-2 rounded-full hover:bg-[#333] transition-colors"
          title="Download"
        >
          <FiDownload size={18} className="text-white" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 rounded-full hover:bg-[#333] transition-colors text-white"
          title="Move to Trash"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
          ) : (
            <FiTrash2 size={18} />
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default FileCard;
