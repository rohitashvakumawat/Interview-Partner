# 🎯 Interview Practice Partner

An AI-powered interview practice platform that helps users improve their interview skills through realistic mock interviews with personalized feedback.

## Thank you note:
Thank you for giving me the opportunity to work on this assessment. Even though I couldn’t complete the entire system due to time constraints, I truly enjoyed the learning process and exploring new concepts. Regardless of the outcome, I’ll continue improving the project and plan to take it live.

## ✨ Features

- **🤖 AI-Powered Interviews**: Realistic interview simulations using LangGraph and local LLMs
- **🎤 Voice & Text Support**: Practice with both voice and text responses
- **📊 Detailed Analytics**: Track your progress with comprehensive performance metrics
- **💡 Personalized Feedback**: Get specific recommendations for improvement
- **📝 Resume Parsing**: Automatic skill extraction from uploaded resumes
- **🔐 Secure Authentication**: Phone-based OTP verification
- **📈 Progress Tracking**: Monitor improvement over time

## 🏗️ Architecture

### Backend
- **FastAPI**: High-performance Python web framework
- **LangGraph**: Sophisticated interview flow management
- **Local LLM**: Mistral-7B for AI responses
- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **Whisper**: Speech-to-text
- **TTS**: Text-to-speech synthesis

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Zustand**: State management
- **Chart.js**: Data visualization

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.10+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/interview-partner.git
cd interview-partner
