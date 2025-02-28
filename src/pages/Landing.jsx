import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiShare2, FiLock } from 'react-icons/fi';

const Landing = () => {
  const features = [
    {
      icon: <FiUpload className="w-6 h-6" />,
      title: 'Easy Upload',
      description: 'Drag & drop files or click to upload'
    },
    {
      icon: <FiShare2 className="w-6 h-6" />,
      title: 'Quick Share',
      description: 'Share files with a simple link'
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: 'Secure',
      description: 'End-to-end encryption for your files'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Share Files with Style
          </h1>
          <p className="text-lg md:text-xl text-[#A1A1A1] mb-10">
            A minimalist file sharing platform that puts design and simplicity first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-black font-medium rounded-xl px-8 py-3 text-lg 
                shadow-lg transition-all duration-300 hover:bg-opacity-90 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-transparent text-white font-medium rounded-xl px-8 py-3 text-lg
                border border-white/30 transition-all duration-300 hover:bg-white/10 hover:border-white
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-surface py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="bg-[#1A1A1A] p-6 rounded-xl hover:bg-[#222222] transition-all duration-300 cursor-default border border-[#333]"
              >
                <div className="mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-[#A1A1A1]">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background py-8">
        <div className="container mx-auto px-4 text-center text-[#777]">
          <p> {new Date().getFullYear()} Fileo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
