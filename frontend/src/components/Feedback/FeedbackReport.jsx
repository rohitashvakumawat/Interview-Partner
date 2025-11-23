import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Award, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Download,
  Home
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import ScoreCard from './ScoreCard';
import Recommendations from './Recommendations';
import toast from 'react-hot-toast';

export default function FeedbackReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      const response = await analyticsAPI.getEvaluation(id);
      setEvaluation(response.data);
    } catch (error) {
      toast.error('Failed to load evaluation');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    toast.success('Report downloaded!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Interview Evaluation
              </h1>
              <p className="text-gray-600 mt-1">
                {evaluation.interview.role} • {new Date(evaluation.interview.completed_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadReport}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-lg mb-2">Overall Performance</p>
              <div className="flex items-baseline">
                <span className="text-6xl font-bold">{evaluation.scores.overall.toFixed(1)}</span>
                <span className="text-3xl ml-2">/100</span>
              </div>
              <p className="text-white/90 mt-2 text-lg">
                {getScoreLabel(evaluation.scores.overall)}
              </p>
            </div>
            <div className="text-right">
              <Award className="w-24 h-24 text-white/30" />
            </div>
          </div>
        </motion.div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ScoreCard
            title="Communication"
            score={evaluation.scores.communication}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />
          <ScoreCard
            title="Technical"
            score={evaluation.scores.technical}
            icon={<Award className="w-6 h-6" />}
            color="green"
          />
          <ScoreCard
            title="Problem Solving"
            score={evaluation.scores.problem_solving}
            icon={<AlertCircle className="w-6 h-6" />}
            color="purple"
          />
          <ScoreCard
            title="Confidence"
            score={evaluation.scores.confidence}
            icon={<CheckCircle className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Key Strengths
            </h3>
            <div className="space-y-3">
              {evaluation.strengths.map((strength, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start bg-green-50 rounded-lg p-3 border border-green-200"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{strength}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {evaluation.weaknesses.map((weakness, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start bg-orange-50 rounded-lg p-3 border border-orange-200"
                >
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{weakness}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Question-wise Feedback */}
        {evaluation.question_feedback && evaluation.question_feedback.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Question-by-Question Analysis
            </h3>
            <div className="space-y-6">
              {evaluation.question_feedback.map((feedback, index) => (
                <div key={index} className="border-l-4 border-primary-500 pl-4">
                  <p className="font-medium text-gray-900 mb-2">
                    Q{index + 1}: {feedback.question}
                  </p>
                  <p className="text-gray-700 mb-2 bg-gray-50 p-3 rounded">
                    <span className="font-medium">Your Answer:</span> {feedback.response}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Feedback:</span> {feedback.evaluation}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <Recommendations
          recommendations={evaluation.recommendations}
          improvementAreas={evaluation.improvement_areas}
        />

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What's Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/interview/new')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-primary-300 hover:border-primary-500 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <p className="font-medium text-gray-900">Practice Again</p>
                <p className="text-sm text-gray-600 mt-1">Start a new interview</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/analytics')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-primary-300 hover:border-primary-500 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600 mt-1">Track your progress</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-primary-300 hover:border-primary-500 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">👤</div>
                <p className="font-medium text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-600 mt-1">Add more skills</p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function getScoreLabel(score) {
  if (score >= 85) return 'Excellent Performance! 🎉';
  if (score >= 70) return 'Good Job! 👍';
  if (score >= 55) return 'Room for Improvement 💪';
  return 'Keep Practicing! 📚';
}