import { motion } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

export default function AudioControls({ 
  isRecording, 
  isProcessing, 
  onStartRecording, 
  onStopRecording 
}) {
  return (
    <div className="flex flex-col items-center">
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-3 h-3 bg-red-600 rounded-full"
            />
            <span className="font-medium">Recording...</span>
          </div>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isProcessing}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
        
        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full border-4 border-red-300 opacity-50"
          />
        )}
      </motion.button>

      <p className="mt-4 text-sm text-gray-600 text-center">
        {isRecording ? 'Click to stop recording' : 'Click to start recording'}
      </p>
    </div>
  );
}