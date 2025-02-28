import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { showToast } from '../components/ui/Toast';
import { FiUser, FiLock, FiMoon, FiSun, FiTrash2, FiSave, FiLogOut } from 'react-icons/fi';

const Settings = () => {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { supabase } = useSupabase();
  
  const [activeTab, setActiveTab] = useState('account');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar_url: '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [storage, setStorage] = useState({
    used: 0,
    total: 500 * 1024 * 1024, // 500 MB default limit
    files: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Fetch user profile data and storage info
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is the error code for no rows returned
          throw profileError;
        }
        
        // If profile exists, use it; otherwise use user data
        if (profile) {
          setProfileData({
            name: profile.full_name || '',
            email: user.email,
            avatar_url: profile.avatar_url || '',
          });
        } else {
          setProfileData({
            name: '',
            email: user.email,
            avatar_url: '',
          });
        }
        
        // Fetch storage info
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('size')
          .eq('user_id', user.id);
          
        if (filesError) throw filesError;
        
        if (files) {
          const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
          setStorage({
            used: totalSize,
            total: 500 * 1024 * 1024, // 500 MB
            files: files.length,
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error.message);
        showToast(`Error fetching profile data: ${error.message}`, 'error');
      }
    };
    
    fetchProfileData();
  }, [user, supabase]);
  
  // Format bytes to readable string
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate storage percentage
  const storagePercentage = Math.min(100, Math.round((storage.used / storage.total) * 100));
  
  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.name,
          avatar_url: profileData.avatar_url,
          updated_at: new Date(),
        });
        
      if (error) throw error;
      
      // Update the user profile in the auth context
      updateProfile({
        name: profileData.name,
        avatar_url: profileData.avatar_url,
      });
      
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error.message);
      showToast(`Error updating profile: ${error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    
    if (passwords.new.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (error) throw error;
      
      // Clear password fields
      setPasswords({
        current: '',
        new: '',
        confirm: '',
      });
      
      showToast('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error updating password:', error.message);
      showToast(`Error updating password: ${error.message}`, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect is handled by the auth context
    } catch (error) {
      console.error('Error logging out:', error.message);
      showToast(`Error logging out: ${error.message}`, 'error');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Settings Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'account' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          <FiUser size={18} className="inline-block mr-2" />
          Account
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'security' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          <FiLock size={18} className="inline-block mr-2" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'preferences' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          {theme === 'dark' ? (
            <FiMoon size={18} className="inline-block mr-2" />
          ) : (
            <FiSun size={18} className="inline-block mr-2" />
          )}
          Preferences
        </button>
      </div>
      
      {/* Account Settings */}
      {activeTab === 'account' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Profile Information</h2>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input"
                  placeholder="Your full name"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  disabled
                  className="input disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">
                  To change your email, please contact support.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-primary flex items-center"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-medium mb-4">Storage Usage</h2>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300">
                  Used {formatBytes(storage.used)} of {formatBytes(storage.total)}
                </span>
                <span className="font-medium">{storagePercentage}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    storagePercentage > 90 
                      ? 'bg-red-500' 
                      : storagePercentage > 70 
                        ? 'bg-yellow-500' 
                        : 'bg-primary'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-gray-700 dark:text-gray-300">
              You have {storage.files} {storage.files === 1 ? 'file' : 'files'} stored in your account.
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Security Settings */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Change Password</h2>
            
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="current-password">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current-password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="input"
                  placeholder="Enter your current password"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="new-password">
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="input"
                  placeholder="Enter your new password"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 6 characters, use a mix of letters, numbers and symbols.
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="input"
                  placeholder="Confirm your new password"
                />
              </div>
              
              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn btn-primary flex items-center"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FiLock size={18} className="mr-2" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-medium mb-4">Account Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleLogout}
                className="btn btn-secondary flex items-center justify-center"
              >
                <FiLogOut size={18} className="mr-2" />
                Logout
              </button>
              
              <button 
                className="btn btn-secondary text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    showToast('Please contact support to delete your account', 'info');
                  }
                }}
              >
                <FiTrash2 size={18} className="mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Preferences */}
      {activeTab === 'preferences' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6">
            <h2 className="text-xl font-medium mb-4">Theme Preferences</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">Appearance</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {theme === 'dark' ? 'Dark' : 'Light'} mode is currently active
                </p>
              </div>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {theme === 'dark' ? (
                  <FiSun size={24} />
                ) : (
                  <FiMoon size={24} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;
