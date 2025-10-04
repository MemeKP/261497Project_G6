import { useEffect, useRef, useState } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { TrendingUp } from 'lucide-react';

// Register Chart.js components
Chart.register(...registerables);

interface PaymentData {
  date: string;
  thisMonth: number;
  lastMonth: number;
}

interface PaymentGraphProps {
  data?: PaymentData[];
  period?: 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'week' | 'month' | 'year') => void;
}

const PaymentGraph = ({ 
  data, 
  period = 'month',
  onPeriodChange 
}: PaymentGraphProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Default demo data
  const defaultData: PaymentData[] = [
    { date: 'Week 1', thisMonth: 4500, lastMonth: 3800 },
    { date: 'Week 2', thisMonth: 5200, lastMonth: 4200 },
    { date: 'Week 3', thisMonth: 4800, lastMonth: 5000 },
    { date: 'Week 4', thisMonth: 6500, lastMonth: 4500 },
  ];

  const chartData = data || defaultData;

  // Calculate statistics
  const thisMonthTotal = chartData.reduce((sum, item) => sum + item.thisMonth, 0);
  const lastMonthTotal = chartData.reduce((sum, item) => sum + item.lastMonth, 0);
  const avgPerDay = Math.round(thisMonthTotal / 30);
  const growthRate = lastMonthTotal > 0 
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
    : '0';

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartData.map(item => item.date),
        datasets: [
          {
            label: 'This Month',
            data: chartData.map(item => item.thisMonth),
            borderColor: '#6366f1', // Indigo
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'Last Month',
            data: chartData.map(item => item.lastMonth),
            borderColor: '#e5e7eb', // Gray
            backgroundColor: 'rgba(229, 231, 235, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#e5e7eb',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: "'Inter', sans-serif",
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '฿' + context.parsed.y.toLocaleString();
                return label;
              }
            }
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
            ticks: {
              callback: function(value) {
                return '฿' + value.toLocaleString();
              },
              font: {
                size: 11,
              },
            },
          },
        },
      },
    };

    chartInstanceRef.current = new Chart(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData]);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className=" items-center  mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Compare this month with last month</p>
        </div>  
      </div>
      {/* Period Selector */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 mt-6">
        {/* Total This Month */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-600">This Month</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{thisMonthTotal.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-medium ${
              parseFloat(growthRate) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {parseFloat(growthRate) >= 0 ? '+' : ''}{growthRate}%
            </span>
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        </div>

        {/* Average Per Day */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg per Day</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{avgPerDay.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Based on 30 days
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 sm:h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default PaymentGraph;