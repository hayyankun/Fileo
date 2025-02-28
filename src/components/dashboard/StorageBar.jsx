import { motion } from 'framer-motion';

const StorageBar = ({ used, total }) => {
  const percentage = (used / total) * 100;
  const usedFormatted = (used / (1024 * 1024 * 1024)).toFixed(2); // Convert to GB
  const totalFormatted = (total / (1024 * 1024 * 1024)).toFixed(2); // Convert to GB

  return (
    <div className="w-full space-y-2.5 p-4 bg-[#1A1A1A] rounded-xl shadow-soft">
      <div className="flex justify-between items-center text-sm">
        <span className="text-white font-medium">Storage Used</span>
        <span className="text-[#A1A1A1] font-medium">{usedFormatted} GB of {totalFormatted} GB</span>
      </div>
      <div className="relative h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`absolute top-0 left-0 h-full rounded-full ${
            percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-[#0084FF]'
          }`}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-xs font-medium text-[#A1A1A1]">{percentage.toFixed(1)}% used</span>
      </div>
    </div>
  );
};

export default StorageBar;
