'use client';

import { useEffect, useState } from 'react';
import { ReportGenerator } from '@/components/reports/report-generator';
import { DataTable } from '@/components/analytics/data-table';
import { FileText, Download, Calendar } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  reportType: string;
  format: string;
  generatedAt: string;
  fileSize: number;
  generator?: {
    name: string;
    email: string;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'title',
      label: 'Report Title',
      sortable: true,
      render: (value: string, row: Report) => (
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-400 mr-2" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'reportType',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'format',
      label: 'Format',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          {value}
        </span>
      ),
    },
    {
      key: 'fileSize',
      label: 'Size',
      sortable: true,
      render: (value: number) => formatFileSize(value),
    },
    {
      key: 'generatedAt',
      label: 'Generated',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string, row: Report) => (
        <button
          onClick={() => window.open(row.fileUrl || '#', '_blank')}
          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          disabled={!row.fileUrl}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">
            Generate and manage analytics reports
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Generator */}
          <div className="lg:col-span-1">
            <ReportGenerator onGenerate={fetchReports} />
          </div>

          {/* Reports List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-center text-gray-500">Loading reports...</p>
              </div>
            ) : reports.length > 0 ? (
              <DataTable data={reports} columns={columns} title="Generated Reports" />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-center text-gray-500">
                  No reports generated yet. Create your first report using the form on the
                  left.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Report Templates */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Available Report Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Tournament Summary</h3>
              <p className="text-sm text-gray-600">
                Comprehensive overview of a specific tournament including participants,
                scores, and revenue.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Player Performance</h3>
              <p className="text-sm text-gray-600">
                Detailed performance analytics for individual players including score
                history and trends.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Financial Report</h3>
              <p className="text-sm text-gray-600">
                Revenue breakdown by tournament, payment statistics, and financial trends.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
