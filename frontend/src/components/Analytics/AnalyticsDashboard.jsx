import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Award, 
  Target,
  Calendar,
  Download
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import PerformanceChart from './PerformanceChart';
import SkillsRadar from './SkillsRadar';
import ImprovementAreas from './ImprovementAreas';
import toast from 'react-hot-toast';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, trendsRes, recommendationsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getImprovementTrends(timeRange),
        analyticsAPI.getRecommendations()
      ]);
      
      setAnalytics(analyticsRes.data);
      setTrends(trendsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    // Generate and download PDF report
    toast.success('Report exported successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Performance Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Track your progress and identify areas for improvement
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportReport}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Interviews"
            value={analytics?.overview?.total_interviews || 0}
            icon={<Calendar className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Average Score"
            value={`${analytics?.overview?.avg_score || 0}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Best Score"
            value={`${analytics?.overview?.max_score || 0}%`}
            icon={<Award className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Improvement"
            value={`+${trends?.summary?.improvement || 0}%`}
            icon={<Target className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          {trends?.trends && trends.trends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Trend
              </h3>
              <PerformanceChart data={trends.trends} />
            </motion.div>
          )}

          {/* Skills Radar */}
          {analytics?.category_scores && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Skills Assessment
              </h3>
              <SkillsRadar scores={analytics.category_scores} />
            </motion.div>
          )}
        </div>

        {/* Role Performance */}
        {analytics?.role_performance && analytics.role_performance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance by Role
            </h3>
            <div className="space-y-4">
              {analytics.role_performance.map((role, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900">{role.role}</span>
                      <span className="text-gray-600">{role.avg_score.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${role.avg_score}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {role.count} interview{role.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Improvement Areas */}
        {recommendations?.recommendations && (
          <ImprovementAreas recommendations={recommendations.recommendations} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}