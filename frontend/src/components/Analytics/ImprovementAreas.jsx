import { motion } from 'framer-motion';
import { Target, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';

export default function ImprovementAreas({ recommendations }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2 text-primary-600" />
          Personalized Improvement Plan
        </h3>
        <span className="text-sm text-gray-600">
          {recommendations.length} area{recommendations.length !== 1 ? 's' : ''} identified
        </span>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">{getPriorityIcon(rec.priority)}</span>
                  <h4 className="font-semibold text-gray-900">{rec.area}</h4>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-sm text-gray-600">
                    Mentioned {rec.frequency}x
                  </span>
                </div>
              </div>
            </div>

            {/* Action Items */}
            {rec.action_items && rec.action_items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Action Plan:
                </p>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {rec.action_items[0]}
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Recommendations */}
      <div className="mt-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-5 border border-primary-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
          Recommended Resources
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">•</span>
            <span>Practice STAR method for behavioral questions</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">•</span>
            <span>Review technical concepts related to your target role</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">•</span>
            <span>Record yourself answering questions to improve delivery</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">•</span>
            <span>Schedule regular practice sessions (2-3 times per week)</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}