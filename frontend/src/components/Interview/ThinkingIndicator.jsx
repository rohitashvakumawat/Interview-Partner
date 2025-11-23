import { motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';

export default function ThinkingIndicator({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex justify-start"
    >
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 max-w-[80%] border border-purple-200">
        <div className="flex items-center mb-2">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          <span className="text-sm font-medium text-purple-900">AI is thinking...</span>
        </div>
        <p className="text-gray-700 text-sm italic">{message}</p>
        <div className="flex space-x-1 mt-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
            className="w-2 h-2 bg-purple-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            className="w-2 h-2 bg-purple-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            className="w-2 h-2 bg-purple-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}