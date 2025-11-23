import { motion } from 'framer-motion';

export default function ScoreCard({ title, score, icon, color }) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      progress: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      progress: 'bg-green-500'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      progress: 'bg-purple-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      progress: 'bg-yellow-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <div className={colors.text}>{icon}</div>
        </div>
        <span className="text-3xl font-bold text-gray-900">
          {score.toFixed(1)}
        </span>
      </div>
      
      <h4 className="text-sm font-medium text-gray-600 mb-3">{title}</h4>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-2 rounded-full ${colors.progress}`}
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        {score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Average' : 'Needs Work'}
      </p>
    </motion.div>
  );
}