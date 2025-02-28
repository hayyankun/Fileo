import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmail } from '../../utils/supabaseClient';
import { showToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) throw error;
      
      showToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || 'Failed to sign in', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111] px-4 py-12 font-inter">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1A1A1A] rounded-xl shadow-soft p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-white">Welcome back</h1>
          <p className="text-[#A1A1A1]">Sign in to access your files</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[#A1A1A1] text-sm">Password</label>
              <Link to="/forgot-password" className="text-[#A1A1A1] text-sm hover:text-white">
                Forgot password?
              </Link>
            </div>
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
                placeholder="Enter your password"
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
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-[#A1A1A1]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
