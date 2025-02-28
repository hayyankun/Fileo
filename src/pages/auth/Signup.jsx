import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signUpWithEmail } from '../../utils/supabaseClient';
import { showToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiCheck } from 'react-icons/fi';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUpWithEmail(email, password);
      
      if (error) throw error;
      
      // Success - email confirmation sent
      setSuccess(true);
      showToast('Signup successful! Check your email to confirm your account.', 'success');
    } catch (error) {
      console.error('Signup error:', error);
      showToast(error.message || 'Failed to sign up', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111] px-4 py-12 font-inter">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1A1A1A] rounded-xl shadow-soft p-8 w-full max-w-md text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center">
              <FiCheck className="text-white text-3xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Verification Email Sent</h2>
          <p className="text-[#A1A1A1] mb-8">
            We've sent a verification email to <span className="text-white">{email}</span>. 
            Please check your inbox and click the verification link to complete your registration.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-white text-black font-medium rounded-xl 
                       hover:bg-opacity-90 transition-all"
            >
              Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111] px-4 py-12 font-inter">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1A1A1A] rounded-xl shadow-soft p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-white">Create an account</h1>
          <p className="text-[#A1A1A1]">Join Fileo to store and share your files</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-[#A1A1A1] text-sm mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-[#808080]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#222] border border-[#333] rounded-xl text-white placeholder-[#808080] 
                         focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[#A1A1A1] text-sm mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-[#808080]" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#222] border border-[#333] rounded-xl text-white placeholder-[#808080] 
                         focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                placeholder="Create a password"
                required
              />
            </div>
            <p className="text-[#808080] text-xs mt-1">Must be at least 6 characters</p>
          </div>
          
          <div>
            <label className="block text-[#A1A1A1] text-sm mb-2">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-[#808080]" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#222] border border-[#333] rounded-xl text-white placeholder-[#808080] 
                         focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-white text-black font-medium rounded-xl transition-all 
                     hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-black rounded-full animate-spin mr-2"></div>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-[#A1A1A1]">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
