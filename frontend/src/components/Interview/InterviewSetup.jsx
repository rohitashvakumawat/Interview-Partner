import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Target, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ROLES, DIFFICULTY_LEVELS } from '../../utils/constants';
import useInterviewStore from '../../stores/interviewStore';
import toast from 'react-hot-toast';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { createInterview, isLoading } = useInterviewStore();
  
  const [formData, setFormData] = useState({
    role: '',
    difficulty: 'medium',
    duration_minutes: 30,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }

    try {
      const interview = await createInterview(formData);
      toast.success('Interview created successfully!');
      navigate(`/interview/${interview.id}`);
    } catch (error) {
      toast.error('Failed to create interview');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Start Your Practice Interview
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your role and difficulty level to begin
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
                Select Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ROLES.map((role) => (
                  <motion.button
                    key={role}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, role })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.role === role
                        ? 'border-primary-500 bg-primary-50 text-primary-900'
                        : 'border-gray-200 hover:border-primary-300 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{role}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Target className="w-5 h-5 mr-2 text-primary-600" />
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                {DIFFICULTY_LEVELS.map((level) => (
                  <motion.button
                    key={level.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, difficulty: level.value })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.difficulty === level.value
                        ? `border-${level.color}-500 bg-${level.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        formData.difficulty === level.value
                          ? `bg-${level.color}-500`
                          : 'bg-gray-300'
                      }`} />
                      <span className="font-medium">{level.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                Interview Duration
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-bold text-primary-600 min-w-[80px]">
                  {formData.duration_minutes} min
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !formData.role}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                'Creating Interview...'
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <h3 className="font-semibold text-blue-900 mb-3">💡 Interview Tips</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Find a quiet place with good internet connection</li>
            <li>• Allow microphone access for voice responses</li>
            <li>• Speak clearly and take your time to think</li>
            <li>• Be honest and authentic in your responses</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}