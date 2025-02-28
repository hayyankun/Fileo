import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import { FiDownload, FiShare2, FiTrash2, FiEdit, FiSave, FiX, FiClock, FiLock } from 'react-icons/fi';
import { STORAGE_BUCKET } from '../utils/supabaseClient';

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
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const FileDetails = () => {
  const { id } = useParams();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  
  const [fileDetails, setFileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    hasPassword: false,
    password: '',
    hasExpiry: false,
    expiryDate: '',
  });
  const [shareUrl, setShareUrl] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  
  // Fetch file details
  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setFileDetails(data);
          setNewFileName(data.filename);
        } else {
          // File not found
          showToast('File not found', 'error');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching file details:', error.message);
        showToast(`Error: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFileDetails();
  }, [id, supabase, navigate]);
  
  // Handle download
  const handleDownload = async () => {
    if (!fileDetails) return;
    
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(fileDetails.file_path);
        
      if (error) throw error;
      
      // Create a URL for the blob and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileDetails.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Download started', 'success');
    } catch (error) {
      console.error('Error downloading file:', error.message);
      showToast(`Download failed: ${error.message}`, 'error');
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!fileDetails) return;
    
    if (window.confirm(`Are you sure you want to delete ${fileDetails.filename}?`)) {
      setIsDeleting(true);
      try {
        // Delete the file from storage
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([fileDetails.file_path]);
          
        if (storageError) throw storageError;
        
        // Delete the file record from the database
        const { error: dbError } = await supabase
          .from('files')
          .delete()
          .eq('id', fileDetails.id);
          
        if (dbError) throw dbError;
        
        showToast(`${fileDetails.filename} deleted successfully`, 'success');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting file:', error.message);
        showToast(`Deletion failed: ${error.message}`, 'error');
        setIsDeleting(false);
      }
    }
  };
  
  // Handle rename
  const handleRename = async () => {
    if (!fileDetails || !newFileName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('files')
        .update({ filename: newFileName })
        .eq('id', fileDetails.id);
        
      if (error) throw error;
      
      setFileDetails({ ...fileDetails, filename: newFileName });
      setIsRenaming(false);
      showToast('File renamed successfully', 'success');
    } catch (error) {
      console.error('Error renaming file:', error.message);
      showToast(`Rename failed: ${error.message}`, 'error');
    }
  };
  
  // Generate share link
  const generateShareLink = async () => {
    setGeneratingLink(true);
    
    try {
      // First check if the shares table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'shares');
        
      if (tableError || !tableCheck || tableCheck.length === 0) {
        throw new Error("Shares table does not exist. Please run the database setup script first.");
      }
      
      // Generate a unique token for this share
      const linkToken = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Set password if enabled
      const password = shareSettings.hasPassword ? shareSettings.password : null;
      
      // Set expiry date if enabled
      const expiry = shareSettings.hasExpiry ? shareSettings.expiryDate : null;
      
      // Check if we already have a share for this file
      const { data: existingShares, error: fetchError } = await supabase
        .from('shares')
        .select('id')
        .eq('file_id', fileDetails.id);
        
      if (fetchError) throw fetchError;
      
      if (existingShares && existingShares.length > 0) {
        // Update existing share
        const { error: updateError } = await supabase
          .from('shares')
          .update({
            access_key: linkToken,
            is_password_protected: !!password,
            password_hash: password,
            expires_at: expiry,
            is_active: true
          })
          .eq('id', existingShares[0].id);
          
        if (updateError) throw updateError;
      } else {
        // Create new share
        const { error: createError } = await supabase
          .from('shares')
          .insert({
            file_id: fileDetails.id,
            user_id: fileDetails.user_id,
            access_key: linkToken,
            is_password_protected: !!password,
            password_hash: password,
            expires_at: expiry,
            is_active: true
          });
          
        if (createError) throw createError;
      }
      
      // Generate shareable URL
      const shareableUrl = `${window.location.origin}/share/${linkToken}`;
      setShareUrl(shareableUrl);
      
      showToast('Share link generated successfully', 'success');
    } catch (error) {
      console.error('Error generating share link:', error);
      showToast(`Share failed: ${error.message}`, 'error');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copy share URL to clipboard
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('Link copied to clipboard', 'success'))
      .catch(err => showToast('Failed to copy link', 'error'));
  };
  
  // Determine if the file is an image that can be previewed
  const isPreviewableImage = fileDetails && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    fileDetails.filename.split('.').pop().toLowerCase()
  );
  
  const isPDF = fileDetails && fileDetails.filename.toLowerCase().endsWith('.pdf');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!fileDetails) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">File not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          The file you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* File Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="input"
                autoFocus
              />
              <button 
                onClick={handleRename}
                className="p-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              >
                <FiSave size={20} />
              </button>
              <button 
                onClick={() => {
                  setIsRenaming(false);
                  setNewFileName(fileDetails.filename);
                }}
                className="p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <FiX size={20} />
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              {fileDetails.filename}
              <button 
                onClick={() => setIsRenaming(true)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                title="Rename file"
              >
                <FiEdit size={16} />
              </button>
            </h1>
          )}
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {formatFileSize(fileDetails.size)} • Uploaded {formatDate(fileDetails.created_at)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiDownload size={18} />
            Download
          </button>
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiShare2 size={18} />
            Share
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-secondary text-red-500 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-full animate-spin"></div>
            ) : (
              <FiTrash2 size={18} />
            )}
            Delete
          </button>
        </div>
      </div>
      
      {/* Share Options Panel */}
      {showShareOptions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 mb-6"
        >
          <h3 className="text-lg font-medium mb-4">Share Options</h3>
          
          {/* Password Protection */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="hasPassword"
                checked={shareSettings.hasPassword}
                onChange={(e) => setShareSettings({
                  ...shareSettings,
                  hasPassword: e.target.checked,
                  password: e.target.checked ? shareSettings.password : '',
                })}
                className="mr-2"
              />
              <label htmlFor="hasPassword" className="flex items-center">
                <FiLock size={16} className="mr-2" />
                Password Protection
              </label>
            </div>
            
            {shareSettings.hasPassword && (
              <input
                type="password"
                placeholder="Enter password"
                value={shareSettings.password}
                onChange={(e) => setShareSettings({
                  ...shareSettings,
                  password: e.target.value
                })}
                className="input mt-2"
              />
            )}
          </div>
          
          {/* Expiry Date */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="hasExpiry"
                checked={shareSettings.hasExpiry}
                onChange={(e) => setShareSettings({
                  ...shareSettings,
                  hasExpiry: e.target.checked,
                  expiryDate: e.target.checked 
                    ? shareSettings.expiryDate || new Date(Date.now() + 86400000).toISOString().slice(0, 16) 
                    : '',
                })}
                className="mr-2"
              />
              <label htmlFor="hasExpiry" className="flex items-center">
                <FiClock size={16} className="mr-2" />
                Set Expiry Date
              </label>
            </div>
            
            {shareSettings.hasExpiry && (
              <input
                type="datetime-local"
                value={shareSettings.expiryDate}
                onChange={(e) => setShareSettings({
                  ...shareSettings,
                  expiryDate: e.target.value
                })}
                min={new Date().toISOString().slice(0, 16)}
                className="input mt-2"
              />
            )}
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-4">
            <button
              onClick={generateShareLink}
              disabled={generatingLink}
              className="btn btn-primary"
            >
              {generatingLink ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Generating Link...
                </div>
              ) : (
                <>Generate Share Link</>
              )}
            </button>
            
            {shareUrl && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input flex-1"
                  />
                  <button
                    onClick={copyShareUrl}
                    className="btn btn-secondary flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* File Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">File Preview</h3>
        
        <div className="flex justify-center items-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {isPreviewableImage ? (
            <img
              src={fileDetails.file_url}
              alt={fileDetails.filename}
              className="max-w-full max-h-96 object-contain rounded-md"
            />
          ) : isPDF && fileDetails.file_url ? (
            <iframe
              src={`${fileDetails.file_url}#view=FitH`}
              title={fileDetails.filename}
              className="w-full h-96 rounded-md"
            />
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-gray-500"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Preview not available for this file type
              </p>
              <button
                onClick={handleDownload}
                className="btn btn-secondary mt-4"
              >
                <FiDownload size={18} className="mr-2" />
                Download to View
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* File Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-medium mb-4">File Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">File Name</p>
            <p className="font-medium">{fileDetails.filename}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">File Type</p>
            <p className="font-medium">
              {fileDetails.filename.split('.').pop().toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
            <p className="font-medium">{formatFileSize(fileDetails.size)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded</p>
            <p className="font-medium">{formatDate(fileDetails.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetails;
