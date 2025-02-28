import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import { FiUploadCloud, FiFile, FiX, FiAlertTriangle, FiUpload } from 'react-icons/fi';
import { STORAGE_BUCKET, validateBucket } from '../utils/supabaseClient';

// Helper function to generate a unique filename
const generateUniqueFileName = (file) => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
};

const Upload = () => {
  const { user, isAuthenticated } = useAuth();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [bucketValid, setBucketValid] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login');
    }

    // Validate the storage bucket on component mount
    const checkBucket = async () => {
      const isValid = await validateBucket();
      setBucketValid(isValid);
      
      if (!isValid) {
        console.error(`Storage bucket '${STORAGE_BUCKET}' is not accessible. File uploads will not work.`);
        showToast('File uploads may not work due to storage configuration issues', 'error');
      } else {
        console.log(`Using storage bucket: ${STORAGE_BUCKET}`);
      }
    };
    
    checkBucket();

    // Handle window resize for responsive design
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated, navigate]);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      const newErrors = {};
      rejectedFiles.forEach(rejected => {
        const fileName = rejected.file.name;
        let errorMessage = 'File could not be accepted';
        
        // Check if file is too large
        if (rejected.errors.some(e => e.code === 'file-too-large')) {
          errorMessage = 'File exceeds maximum size of 10MB';
        } 
        // Check if file type is not supported
        else if (rejected.errors.some(e => e.code === 'file-invalid-type')) {
          errorMessage = 'File type is not supported';
        }
        
        newErrors[fileName] = errorMessage;
        showToast(errorMessage + `: ${fileName}`, 'error');
      });
      
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
    
    // Initialize progress for each accepted file
    const progress = {};
    acceptedFiles.forEach(file => {
      progress[file.name] = 0;
    });
    setUploadProgress(progress);
    
    setFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      )
    ]);
  }, []);

  // Dropzone setup
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'text/plain': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB limit
    noClick: isMobile, // Disable click to open file dialog on mobile
  });

  // Remove file from list
  const removeFile = (fileName) => {
    const newFiles = files.filter(file => file.name !== fileName);
    setFiles(newFiles);
    
    // Also clean up the preview URL to avoid memory leaks
    const fileToRemove = files.find(file => file.name === fileName);
    if (fileToRemove && fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    // Remove any errors associated with this file
    if (errors[fileName]) {
      const newErrors = { ...errors };
      delete newErrors[fileName];
      setErrors(newErrors);
    }
  };

  // Upload all files to Supabase
  const uploadFiles = async () => {
    if (!files.length) {
      showToast('Please select at least one file', 'error');
      return;
    }

    if (!bucketValid) {
      showToast(`Storage bucket '${STORAGE_BUCKET}' is not accessible. Contact support.`, 'error');
      return;
    }

    setUploading(true);
    let anySuccess = false;
    
    try {
      // First make sure the user is authenticated
      if (!user || !user.id) {
        console.error("No authenticated user found:", user);
        showToast('You must be logged in to upload files', 'error');
        setUploading(false);
        return;
      }

      console.log(`Starting upload with user: ${user.id} to bucket: ${STORAGE_BUCKET}`);
      
      // The files table might not have all the expected columns or might not exist
      // So we should check first
      let tableExists = false;
      try {
        console.log("Checking if files table exists...");
        const { data, error } = await supabase
          .from('files')
          .select('id')
          .limit(1);
          
        if (!error) {
          console.log("Files table exists");
          tableExists = true;
        } else {
          console.error("Error checking files table:", error);
        }
      } catch (tableErr) {
        console.error("Error checking files table:", tableErr);
      }
      
      const uploadPromises = files.map(async (file) => {
        try {
          console.log(`Starting upload for file: ${file.name}`);
          
          // Create a unique file path to avoid collisions
          const uniqueFileName = generateUniqueFileName(file);
          const filePath = `${user.id}/${uniqueFileName}`;
          
          console.log(`Generated unique path: ${filePath}`);
          
          // Create a simple blob from the file
          const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
          
          // Upload the file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, fileBlob, {
              cacheControl: '3600',
              upsert: true // Overwrite if exists
            });
            
          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw uploadError;
          }
          
          console.log("File uploaded successfully:", uploadData);
          
          // Get the public URL for the file
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);
            
          const publicUrl = urlData.publicUrl;
          console.log("Public URL generated:", publicUrl);
          
          // Set upload progress to complete
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          
          // Only try to insert into database if the table exists
          if (tableExists) {
            try {
              // Use a simplified database insert with only the columns we're sure exist
              const fileRecord = {
                user_id: user.id,
                filename: file.name,
                size: file.size,
                created_at: new Date().toISOString()
              };
              
              // Add optional fields if we know they're needed
              try {
                fileRecord.file_path = filePath;
                fileRecord.file_url = publicUrl;
                fileRecord.is_deleted = false;
              } catch (e) {
                // Ignore errors for optional fields
              }
              
              const { data: fileData, error: fileError } = await supabase
                .from('files')
                .insert(fileRecord);
                
              if (fileError) {
                console.error("Database error:", fileError);
                // Don't throw - we successfully uploaded the file, that's the main goal
              } else {
                console.log("Database record created:", fileData);
              }
            } catch (dbError) {
              console.error("Failed to create database record:", dbError);
              // Continue - file was uploaded even if we can't create the record
            }
          } else {
            console.log("Skipping database insert as the files table either doesn't exist or has wrong structure");
          }
          
          // Clean up the preview URL
          URL.revokeObjectURL(file.preview);
          anySuccess = true;
          
          return { success: true, filename: file.name };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return { success: false, filename: file.name, error: error.message || "Unknown error" };
        }
      });
      
      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Process results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`Successfully uploaded ${successful} file${successful !== 1 ? 's' : ''}`, 'success');
        navigate('/dashboard');
      } else if (successful === 0) {
        showToast(`Failed to upload all files. Check console for details.`, 'error');
      } else {
        showToast(`Uploaded ${successful} file${successful !== 1 ? 's' : ''}, ${failed} failed. Check console for details.`, 'info');
        if (anySuccess) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error("Fatal upload error:", err);
      showToast("Upload failed due to a system error. Please try again.", 'error');
    } finally {
      setUploading(false);
    }
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-white">Upload Files</h1>
        <p className="text-[#A1A1A1] text-lg">
          Share your files securely with Fileo
        </p>
      </motion.div>
      
      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? 'border-white bg-white/5 scale-[1.02] shadow-lg' : 'border-[#555] hover:border-[#888]'}
            ${isDragAccept ? 'border-green-500 bg-green-500/10' : ''}
            ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
          `}
          style={{
            boxShadow: isDragActive ? '0 0 20px rgba(255, 255, 255, 0.1)' : 'none'
          }}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center mb-6
              ${isDragActive ? 'bg-white/10' : 'bg-[#222]'}
              transition-colors duration-300
            `}>
              <FiUploadCloud size={40} className={`
                ${isDragActive ? 'text-white' : 'text-[#888]'}
                transition-colors duration-300
              `} />
            </div>
            
            {isDragActive ? (
              <p className="text-xl font-medium text-white mb-2 animate-pulse">
                Drop files to upload
              </p>
            ) : (
              <>
                <p className="text-xl font-medium text-white mb-4">
                  {isMobile ? 'Select files to upload' : 'Drag & drop files here'}
                </p>
                <div className="flex items-center gap-2 text-lg text-[#A1A1A1] mb-6">
                  <span className="hidden sm:inline">or</span> 
                  <button 
                    onClick={open}
                    type="button"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <FiUpload /> Browse Files
                    </span>
                  </button>
                </div>
              </>
            )}
            
            <div className="space-y-1 mt-4 text-[#A1A1A1]">
              <p className="text-sm">
                Supported formats: Images, PDFs, Word, Excel, PowerPoint, Text
              </p>
              <p className="text-sm font-medium">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Error List */}
      {Object.keys(errors).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-lg font-medium text-white mb-2">There were issues with some files:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(errors).map(([filename, error]) => (
                  <li key={filename} className="text-[#F99] text-sm">
                    <span className="font-medium">{filename}</span>: {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Selected Files List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 bg-[#111] border border-[#333] rounded-xl p-6"
        >
          <h3 className="text-xl font-medium mb-6 text-white">Selected Files ({files.length})</h3>
          <div className="space-y-4">
            {files.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-[#222] rounded-lg p-4 border border-[#333] hover:border-[#444] transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-3 bg-[#333] rounded-lg">
                    <FiFile size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-white">{file.name}</p>
                    <p className="text-sm text-[#A1A1A1] mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar or Delete Button */}
                {uploading ? (
                  <div className="w-1/3 pr-2">
                    <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full" 
                        style={{ width: `${uploadProgress[file.name] || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-[#A1A1A1] text-right mt-2">
                      {uploadProgress[file.name] || 0}%
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                    className="p-2 text-[#A1A1A1] hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <FiX size={20} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Upload Button */}
          <div className="mt-8 flex justify-center sm:justify-end">
            <button
              onClick={uploadFiles}
              disabled={uploading}
              className="bg-white text-black font-medium rounded-xl px-8 py-3 text-lg 
                shadow-lg transition-all duration-300 hover:bg-opacity-90 hover:scale-[1.02]
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-black rounded-full animate-spin mr-3"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <FiUploadCloud size={20} />
                    Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Upload;
