import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Calendar,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI, analyticsAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import StatsOverview from './StatsOverview';
import ProfileCard from './ProfileCard';
import RecentInterviews from './RecentInterviews';
import PerformanceChart from '../Analytics/PerformanceChart';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        userAPI.getStats(),
        analyticsAPI.getDashboard()
      ]);
      
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
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
                Welcome back, {user?.full_name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Ready to practice your interview skills?
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/interview/new')}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Interview
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview stats={stats} analytics={analytics} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Profile & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileCard user={user} />
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <QuickActionButton
                  icon={<Target className="w-5 h-5" />}
                  label="Start Practice Interview"
                  onClick={() => navigate('/interview/new')}
                  color="primary"
                />
                <QuickActionButton
                  icon={<Award className="w-5 h-5" />}
                  label="View Analytics"
                  onClick={() => navigate('/analytics')}
                  color="secondary"
                />
                <QuickActionButton
                  icon={<Calendar className="w-5 h-5" />}
                  label="Interview History"
                  onClick={() => navigate('/interviews')}
                  color="green"
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column - Charts & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            {analytics?.progress_over_time && analytics.progress_over_time.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Performance Trend
                  </h3>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <PerformanceChart data={analytics.progress_over_time} />
              </motion.div>
            )}

            {/* Recent Interviews */}
            {stats?.recent_interviews && stats.recent_interviews.length > 0 && (
              <RecentInterviews interviews={stats.recent_interviews} />
            )}

            {/* Top Strengths & Weaknesses */}
            {analytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Strengths */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Top Strengths
                  </h3>
                  <div className="space-y-2">
                    {analytics.top_strengths?.slice(0, 5).map((strength, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-green-800">{strength.area}</span>
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          {strength.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Areas to Improve
                  </h3>
                  <div className="space-y-2">
                    {analytics.top_weaknesses?.slice(0, 5).map((weakness, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-orange-800">{weakness.area}</span>
                        <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                          {weakness.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
    secondary: 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      {icon}
      <span className="ml-3 font-medium">{label}</span>
    </motion.button>
  );
}