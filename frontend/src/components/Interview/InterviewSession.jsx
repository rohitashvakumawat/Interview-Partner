import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import useInterviewStore from '../../stores/interviewStore';
import audioService from '../../services/audioService';
import ThinkingIndicator from './ThinkingIndicator';
import TranscriptView from './TranscriptView';
import AudioControls from './AudioControls';
import toast from 'react-hot-toast';

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startInterview, respondToQuestion, completeInterview } = useInterviewStore();
  
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userResponse, setUserResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'
  
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    initializeInterview();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeInterview = async () => {
    try {
      setIsThinking(true);
      setThinkingMessage('Initializing your interview session...');
      
      const response = await startInterview(id);
      
      setCurrentQuestion(response.question);
      setThinkingMessage(response.thinking_process);
      setMaxQuestions(10);
      
      // Add initial question to conversation
      setConversation([{
        role: 'interviewer',
        content: response.question,
        timestamp: new Date().toISOString()
      }]);
      
      // Play audio if enabled
      if (audioEnabled && response.audio_url) {
        playAudio(response.audio_url);
      }
      
      setIsThinking(false);
    } catch (error) {
      toast.error('Failed to start interview');
      navigate('/dashboard');
    }
  };

  const handleStartRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioBlob = await audioService.stopRecording();
      setIsRecording(false);
      
      // Convert to base64 and send
      const audioBase64 = await audioService.blobToBase64(audioBlob);
      await submitResponse(null, audioBase64);
    } catch (error) {
      toast.error('Failed to process recording');
      setIsRecording(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!userResponse.trim()) return;
    
    await submitResponse(userResponse);
    setUserResponse('');
  };

  const submitResponse = async (text, audioData) => {
    setIsProcessing(true);
    setIsThinking(true);
    setThinkingMessage('Analyzing your response...');

    try {
      // Add user response to conversation
      const userMessage = {
        role: 'user',
        content: text || 'Voice response',
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, userMessage]);

      // Submit to backend
      const response = await respondToQuestion(id, {
        message: text || '',
        audio_data: audioData
      });

      setThinkingMessage(response.thinking_process);
      
      // Check if interview is complete
      if (response.message === 'Interview completed') {
        toast.success('Interview completed!');
        setTimeout(() => {
          navigate(`/evaluation/${response.evaluation_id}`);
        }, 2000);
        return;
      }

      // Add interviewer response to conversation
      const interviewerMessage = {
        role: 'interviewer',
        content: response.question,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, interviewerMessage]);
      
      setCurrentQuestion(response.question);
      setQuestionCount(response.question_count);
      
      // Play audio response if enabled
      if (audioEnabled && response.audio_url) {
        await playAudio(response.audio_url);
      }
      
    } catch (error) {
      toast.error('Failed to submit response');
    } finally {
      setIsProcessing(false);
      setIsThinking(false);
    }
  };

  const playAudio = async (audioUrl) => {
    try {
      await audioService.playAudio(audioUrl);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      try {
        const response = await completeInterview(id);
        toast.success('Interview ended');
        navigate(`/evaluation/${response.evaluation_id}`);
      } catch (error) {
        toast.error('Failed to end interview');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview in Progress</h1>
              <p className="text-gray-600 text-sm mt-1">
                Question {questionCount} of {maxQuestions}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-4">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {Math.round((questionCount / maxQuestions) * 100)}%
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  audioEnabled 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleEndInterview}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation Area */}
            <div className="bg-white rounded-xl shadow-sm p-6 h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                <AnimatePresence>
                  {conversation.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.role === 'user' ? 'You' : 'Interviewer'}
                        </p>
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Thinking Indicator */}
                {isThinking && (
                  <ThinkingIndicator message={thinkingMessage} />
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t pt-4">
                {/* Mode Toggle */}
                <div className="flex justify-center mb-4">
                  <div className="inline-flex rounded-lg border border-gray-300 p-1">
                    <button
                      onClick={() => setMode('voice')}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        mode === 'voice'
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Mic className="w-4 h-4 inline mr-2" />
                      Voice
                    </button>
                    <button
                      onClick={() => setMode('text')}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        mode === 'text'
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Send className="w-4 h-4 inline mr-2" />
                      Text
                    </button>
                  </div>
                </div>

                {mode === 'voice' ? (
                  <AudioControls
                    isRecording={isRecording}
                    isProcessing={isProcessing}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                  />
                ) : (
                  <form onSubmit={handleTextSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Type your response..."
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isProcessing || !userResponse.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Question Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Current Question
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {currentQuestion || 'Waiting for question...'}
              </p>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                Interview Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Take your time to think before answering</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Use specific examples from your experience</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Speak clearly and maintain good posture</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Ask for clarification if needed</span>
                </li>
              </ul>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Session Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questions Asked</span>
                  <span className="font-semibold text-gray-900">{questionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-gray-900">{maxQuestions - questionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mode</span>
                  <span className="font-semibold text-gray-900 capitalize">{mode}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}