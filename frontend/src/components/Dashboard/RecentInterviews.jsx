import { motion } from 'framer-motion';
import { Calendar, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';

export default function RecentInterviews({ interviews }) {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Interviews</h3>
        <button
          onClick={() => navigate('/interviews')}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {interviews.map((interview, index) => (
          <motion.div
            key={interview.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/interviews/${interview.id}`)}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
          >
            <div className="flex items-center flex-1">
              <div className="mr-4">
                {getStatusIcon(interview.status)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{interview.role}</h4>
                <p className="text-sm text-gray-600">
                  {formatDate(interview.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}>
                {interview.status.replace('_', ' ')}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}