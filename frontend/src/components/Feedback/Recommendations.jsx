import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, Target } from 'lucide-react';

export default function Recommendations({ recommendations, improvementAreas }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-sm p-6 mb-8"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
        Personalized Recommendations
      </h3>

      {/* Improvement Areas */}
      {improvementAreas && improvementAreas.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2 text-primary-600" />
            Focus Areas
          </h4>
          <div className="space-y-4">
            {improvementAreas.map((area, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{area.area}</h5>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    area.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {area.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {area.action_plan}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
          Next Steps
        </h4>
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="whitespace-pre-line">{recommendations}</p>
        </div>
      </div>
    </motion.div>
  );
}