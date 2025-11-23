export const ROLES = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'Sales Manager',
  'Marketing Manager',
  'Business Analyst',
  'UI/UX Designer',
  'DevOps Engineer',
  'Project Manager',
  'Customer Success Manager',
  'Retail Associate',
  'HR Manager',
];

export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'hard', label: 'Hard', color: 'red' },
];

export const INTERVIEW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const USER_PERSONAS = {
  CONFUSED: {
    name: 'The Confused User',
    description: 'Unsure about what they want',
    characteristics: [
      'Asks many clarifying questions',
      'Changes mind frequently',
      'Needs guidance and suggestions',
    ],
  },
  EFFICIENT: {
    name: 'The Efficient User',
    description: 'Wants quick results',
    characteristics: [
      'Direct and to the point',
      'Skips unnecessary steps',
      'Values speed over exploration',
    ],
  },
  CHATTY: {
    name: 'The Chatty User',
    description: 'Frequently goes off topic',
    characteristics: [
      'Provides lengthy responses',
      'Shares personal anecdotes',
      'Needs gentle redirection',
    ],
  },
  EDGE_CASE: {
    name: 'The Edge Case User',
    description: 'Tests system boundaries',
    characteristics: [
      'Provides invalid inputs',
      'Goes off topic intentionally',
      'Requests features beyond capabilities',
    ],
  },
};

export const SCORE_RANGES = {
  EXCELLENT: { min: 85, max: 100, label: 'Excellent', color: 'green' },
  GOOD: { min: 70, max: 84, label: 'Good', color: 'blue' },
  AVERAGE: { min: 55, max: 69, label: 'Average', color: 'yellow' },
  NEEDS_IMPROVEMENT: { min: 0, max: 54, label: 'Needs Improvement', color: 'red' },
};