import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { userAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function SkillsEditor() {
  const { user, updateUser } = useAuthStore();
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState(user?.skills || []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    
    if (!newSkill.trim()) return;
    
    if (skills.includes(newSkill.trim())) {
      toast.error('Skill already added');
      return;
    }

    const updatedSkills = [...skills, newSkill.trim()];
    setSkills(updatedSkills);
    setNewSkill('');

    try {
      await userAPI.updateProfile({ skills: updatedSkills });
      updateUser({ skills: updatedSkills });
      toast.success('Skill added');
    } catch (error) {
      toast.error('Failed to add skill');
      setSkills(skills); // Revert on error
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);

    try {
      await userAPI.updateProfile({ skills: updatedSkills });
      updateUser({ skills: updatedSkills });
      toast.success('Skill removed');
    } catch (error) {
      toast.error('Failed to remove skill');
      setSkills(skills); // Revert on error
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Skills
      </h2>

      {/* Add Skill Form */}
      <form onSubmit={handleAddSkill} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill (e.g., Python, Leadership)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </form>

      {/* Skills List */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map((skill, index) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center bg-primary-50 text-primary-700 px-3 py-2 rounded-full border border-primary-200"
            >
              <span className="font-medium">{skill}</span>
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {skills.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No skills added yet. Add your first skill above!
        </p>
      )}
    </motion.div>
  );
}