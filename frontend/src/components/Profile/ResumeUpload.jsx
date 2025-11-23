import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { userAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ResumeUpload() {
  const { user, updateUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFile(file);

    try {
      const response = await userAPI.uploadResume(file);
      
      // Update user with parsed data
      if (response.data.parsed_data) {
        updateUser({
          skills: response.data.parsed_data.skills,
          experience_years: response.data.parsed_data.experience_years,
          resume_path: file.name
        });
      }
      
      toast.success('Resume uploaded and parsed successfully!');
    } catch (error) {
      toast.error('Failed to upload resume');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [updateUser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleDelete = async () => {
    try {
      await userAPI.deleteResume();
      setUploadedFile(null);
      updateUser({ resume_path: null });
      toast.success('Resume deleted');
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Resume Upload
      </h2>

      {user?.resume_path || uploadedFile ? (
        <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">
                  {uploadedFile?.name || user.resume_path}
                </p>
                <p className="text-sm text-gray-600">
                  Resume uploaded successfully
                </p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-700 font-medium">Uploading and parsing...</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports PDF and DOCX (max 10MB)
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> We'll automatically extract your skills, experience, and other relevant information from your resume to personalize your interview experience.
        </p>
      </div>
    </motion.div>
  );
}