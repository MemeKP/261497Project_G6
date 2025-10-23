import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import { TrendingUp } from 'lucide-react';
import type { PaymentGraphProps, RevenueData } from '../types';

Chart.register(...registerables);

const PaymentGraph = ({
  period = 'month',
  onPeriodChange
}: PaymentGraphProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูล revenue
  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/payments/revenue?period=${selectedPeriod}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const result = await response.json();

        if (result.success) {
          setRevenueData(result.data);
        } else {
          throw new Error(result.error || 'Failed to load revenue data');
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [selectedPeriod]);

  // อัพเดท chart เมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!revenueData || !chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // const { chartData, statistics } = revenueData;
    const { chartData } = revenueData;

    // chart config
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartData.map(item => {
          // Format วันที่ตาม period ที่เลือก
          const date = new Date(item.date);
          switch (selectedPeriod) {
            case 'week':
              // สำหรับ week: แสดงวันในสัปดาห์ (Mon, Tue, etc.)
              return date.toLocaleDateString('en-US', {
                weekday: 'short'
              });

            case 'month':
              return (() => {
                const day = date.getDate();

                const isMobile = window.innerWidth < 650;
                const isTablet = window.innerWidth < 1024;

                if (isMobile) {
                  if ([1, 5, 10, 15, 20, 25, 30,].includes(day)) {
                    return day.toString();
                  }
                  return '';
                } else if (isTablet && chartData.length > 15) {
                  if (day % 2 === 0 || [1, 15, 30].includes(day)) {
                    return day.toString();
                  }
                  return '';
                } else {
                  // บน desktop หรือข้อมูลน้อย: แสดงทุกวัน
                  return day.toString();
                }
              })();

            case 'year':
              // สำหรับ year: แสดงชื่อเดือน (Jan, Feb, etc.)
              return date.toLocaleDateString('en-US', {
                month: 'short'
              });

            default:
              return item.date;
          }
        }),
        datasets: [
          {
            label: `This ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`,
            data: chartData.map(item => item.amount),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
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
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '฿' + context.parsed.y.toLocaleString();
                return label;
              },
              title: function (context) {
                // const dateStr = context[0].label;
                const dataPoint = chartData[context[0].dataIndex];
                const date = new Date(dataPoint.date);

                switch (selectedPeriod) {
                  case 'week':
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    });

                  case 'month':
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                  case 'year':
                    return date.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    });

                  default:
                    return date.toLocaleDateString();
                }
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
                size: chartData.length > 20 ? 10 : 11,
              },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: chartData.length > 20 ? 10 : 15,
            },
            title: {
              display: true,
              text: getXAxisTitle(selectedPeriod),
              font: {
                size: 12,
                weight: 'bold' as const,
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: function (value) {
                return '฿' + Number(value).toLocaleString();
              },
              font: {
                size: 11,
              },
            },
            title: {
              display: true,
              text: 'Amount (THB)',
              font: {
                size: 12,
                weight: 'bold' as const,
              }
            }
          },
        },
      },
    };

    // ชื่อแกน X
    function getXAxisTitle(period: string): string {
      switch (period) {
        case 'week':
          return 'Days of Week';
        case 'month':
          return 'Days of Month';
        case 'year':
          return 'Months';
        default:
          return 'Date';
      }
    }

    chartInstanceRef.current = new Chart(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [revenueData, selectedPeriod]);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Revenue Data</div>
          <div className="text-gray-500 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-gray-500">No revenue data available</div>
        </div>
      </div>
    );
  }

  const { statistics } = revenueData;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time revenue from confirmed payments</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit mt-4 sm:mt-0">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedPeriod === p
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Total Current Period */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-600">
              This {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
            </span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{statistics.currentTotal.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-medium ${statistics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {statistics.growthRate >= 0 ? '+' : ''}{statistics.growthRate}%
            </span>
            <span className="text-xs text-gray-500">vs previous</span>
          </div>
        </div>

        {/* Average Per Day */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg per Day</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{statistics.avgPerDay.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Based on {selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365} days
          </div>
        </div>

        {/* Previous Period */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Previous {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
            </span>
            <div className="w-5 h-5 text-gray-400"></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ฿{statistics.previousTotal.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Comparison baseline
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