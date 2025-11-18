'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/analytics/metric-card';
import { LineChart } from '@/components/analytics/line-chart';
import { BarChart } from '@/components/analytics/bar-chart';
import { PieChart } from '@/components/analytics/pie-chart';
import {
  TrendingUp,
  Users,
  Trophy,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

interface DashboardData {
  totalTournaments: number;
  upcomingTournaments: number;
  completedTournaments: number;
  totalPlayers: number;
  totalRevenue: number;
  averageScore: number;
}

export default function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [participationTrends, setParticipationTrends] = useState<any>(null);
  const [handicapDistribution, setHandicapDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch dashboard metrics
        const dashboardRes = await fetch('/api/analytics/dashboard');
        const dashboard = await dashboardRes.json();
        setDashboardData(dashboard);

        // Fetch participation trends
        const trendsRes = await fetch('/api/analytics/trends');
        const trends = await trendsRes.json();
        setParticipationTrends(trends);

        // Fetch handicap distribution
        const playersRes = await fetch('/api/players');
        if (playersRes.ok) {
          const players = await playersRes.json();
          // Calculate distribution from player data
          const ranges = {
            '0-9': 0,
            '10-18': 0,
            '19-27': 0,
            '28-36': 0,
            '36+': 0,
          };

          players.forEach((player: any) => {
            const hcp = Number(player.handicapIndex);
            if (hcp < 10) ranges['0-9']++;
            else if (hcp < 19) ranges['10-18']++;
            else if (hcp < 28) ranges['19-27']++;
            else if (hcp <= 36) ranges['28-36']++;
            else ranges['36+']++;
          });

          setHandicapDistribution(ranges);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  const handicapChartData = handicapDistribution
    ? Object.entries(handicapDistribution).map(([range, count]) => ({
        range,
        players: count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into tournament performance and player statistics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Tournaments"
            value={dashboardData?.totalTournaments || 0}
            icon={Trophy}
            description="all time"
          />
          <MetricCard
            title="Active Players"
            value={dashboardData?.totalPlayers || 0}
            icon={Users}
            trend="up"
            change={5.2}
          />
          <MetricCard
            title="Total Revenue"
            value={`€${dashboardData?.totalRevenue.toLocaleString() || 0}`}
            icon={DollarSign}
            description="last 30 days"
            trend="up"
            change={12.5}
          />
          <MetricCard
            title="Avg Score"
            value={dashboardData?.averageScore.toFixed(1) || '0.0'}
            icon={TrendingDown}
            description="net score"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {participationTrends && participationTrends.dataPoints && (
            <LineChart
              title="Participation Trends"
              data={participationTrends.dataPoints}
              xKey="date"
              yKeys={[
                { key: 'participants', color: '#3B82F6', name: 'Participants' },
                { key: 'capacity', color: '#10B981', name: 'Capacity' },
              ]}
              height={300}
            />
          )}

          <BarChart
            title="Handicap Distribution"
            data={handicapChartData}
            xKey="range"
            yKeys={[{ key: 'players', color: '#8B5CF6', name: 'Players' }]}
            height={300}
          />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart
            title="Tournament Status Distribution"
            data={[
              { name: 'Upcoming', value: dashboardData?.upcomingTournaments || 0 },
              { name: 'Completed', value: dashboardData?.completedTournaments || 0 },
              {
                name: 'Other',
                value:
                  (dashboardData?.totalTournaments || 0) -
                  (dashboardData?.upcomingTournaments || 0) -
                  (dashboardData?.completedTournaments || 0),
              },
            ]}
            nameKey="name"
            valueKey="value"
            height={300}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/reports"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
              >
                Generate Report
              </a>
              <a
                href="/api/analytics/export?type=tournaments&format=csv"
                className="block w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
              >
                Export Data (CSV)
              </a>
              <a
                href="/tournaments"
                className="block w-full px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center"
              >
                View Tournaments
              </a>
            </div>
          </div>
        </div>

        {/* Participation Details */}
        {participationTrends && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Participation Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Tournaments</p>
                <p className="text-2xl font-bold">{participationTrends.totalTournaments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Participation</p>
                <p className="text-2xl font-bold">
                  {participationTrends.averageParticipation}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p
                  className={`text-2xl font-bold ${
                    participationTrends.trend.direction === 'up'
                      ? 'text-green-600'
                      : participationTrends.trend.direction === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {participationTrends.trend.direction === 'up' ? '↑' : '↓'}{' '}
                  {Math.abs(participationTrends.trend.percentage).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
