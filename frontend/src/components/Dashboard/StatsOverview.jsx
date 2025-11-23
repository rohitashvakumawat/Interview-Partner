import { motion } from 'framer-motion';
import { 
  Briefcase, 
  CheckCircle, 
  TrendingUp, 
  Award 
} from 'lucide-react';

export default function StatsOverview({ stats, analytics }) {
  const statCards = [
    {
      title: 'Total Interviews',
      value: stats?.total_interviews || 0,
      icon: <Briefcase className="w-6 h-6" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: stats?.completed_interviews || 0,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Average Score',
      value: `${stats?.average_score || 0}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Best Score',
      value: `${analytics?.overview?.max_score || 0}%`,
      icon: <Award className="w-6 h-6" />,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}