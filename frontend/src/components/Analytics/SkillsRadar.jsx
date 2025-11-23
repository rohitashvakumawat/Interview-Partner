import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function SkillsRadar({ scores }) {
  const data = {
    labels: [
      'Communication',
      'Technical',
      'Problem Solving',
      'Confidence'
    ],
    datasets: [
      {
        label: 'Your Scores',
        data: [
          scores.communication,
          scores.technical,
          scores.problem_solving,
          scores.confidence
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Target (85%)',
        data: [85, 85, 85, 85],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function(value) {
            return value + '%';
          }
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.r.toFixed(1) + '%';
          }
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Radar data={data} options={options} />
    </div>
  );
}