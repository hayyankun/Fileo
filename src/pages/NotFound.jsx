import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <div className="relative mb-8">
          <h1 className="text-[120px] font-black text-gray-900 dark:text-white leading-none">
            404
          </h1>
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary text-lg font-medium">
            Page not found
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-soft text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Go back home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
