import { motion } from 'framer-motion';
import { User, Mail, Phone, Briefcase, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfileCard({ user }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        <button
          onClick={() => navigate('/profile')}
          className="text-primary-600 hover:text-primary-700"
        >
          <Edit className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-3">
          <User className="w-10 h-10 text-white" />
        </div>
        <h4 className="text-xl font-bold text-gray-900">{user?.full_name}</h4>
        <p className="text-gray-600 text-sm">
          {user?.experience_years || 0} years experience
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-gray-700">
          <Mail className="w-4 h-4 mr-3 text-gray-400" />
          <span className="text-sm">{user?.email}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <Phone className="w-4 h-4 mr-3 text-gray-400" />
          <span className="text-sm">{user?.phone}</span>
        </div>
        {user?.target_roles && user.target_roles.length > 0 && (
          <div className="flex items-start text-gray-700">
            <Briefcase className="w-4 h-4 mr-3 mt-1 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Target Roles:</p>
              <div className="flex flex-wrap gap-1">
                {user.target_roles.slice(0, 3).map((role, index) => (
                  <span
                    key={index}
                    className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {user?.skills && user.skills.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-medium text-gray-900 mb-3">Top Skills</p>
          <div className="flex flex-wrap gap-2">
            {user.skills.slice(0, 6).map((skill, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}