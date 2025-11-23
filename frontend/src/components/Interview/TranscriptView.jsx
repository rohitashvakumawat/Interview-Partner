import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

export default function TranscriptView({ conversation, interviewRole }) {
  const downloadTranscript = () => {
    const transcript = conversation
      .map(msg => `[${msg.role.toUpperCase()}]: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Interview Transcript
        </h3>
        <button
          onClick={downloadTranscript}
          className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {conversation.map((message, index) => (
          <div key={index} className="border-l-4 border-gray-200 pl-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {message.role === 'user' ? 'You' : 'Interviewer'}
            </p>
            <p className="text-gray-700">{message.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}