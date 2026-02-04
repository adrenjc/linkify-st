import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const mockData = [
  { name: 'Mon', visits: 4000 },
  { name: 'Tue', visits: 3000 },
  { name: 'Wed', visits: 2000 },
  { name: 'Thu', visits: 2780 },
  { name: 'Fri', visits: 1890 },
  { name: 'Sat', visits: 2390 },
  { name: 'Sun', visits: 3490 },
];

const Dashboard: React.FC = () => {
  return (
    <PageContainer title="Dashboard" header={{ title: 'Overview', breadcrumb: {} }}>
      <Row gutter={[24, 24]}>
        {/* Stat Cards */}
        <Col xs={24} sm={12} md={6}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Links</h3>
            <Statistic value={1284} valueStyle={{ fontWeight: 700, fontSize: '28px', color: '#1f2937' }} />
            <div className="text-green-500 text-xs mt-2 flex items-center">
              <span>↑ 12%</span> <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Clicks</h3>
            <Statistic value={45231} valueStyle={{ fontWeight: 700, fontSize: '28px', color: '#1f2937' }} />
            <div className="text-green-500 text-xs mt-2 flex items-center">
              <span>↑ 5.4%</span> <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Active Users</h3>
            <Statistic value={321} valueStyle={{ fontWeight: 700, fontSize: '28px', color: '#1f2937' }} />
            <div className="text-red-500 text-xs mt-2 flex items-center">
              <span>↓ 2%</span> <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Conversion Rate</h3>
            <Statistic value={2.4} suffix="%" precision={1} valueStyle={{ fontWeight: 700, fontSize: '28px', color: '#1f2937' }} />
            <div className="text-green-500 text-xs mt-2 flex items-center">
              <span>↑ 0.8%</span> <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          </div>
        </Col>

        {/* Chart Section */}
        <Col span={24}>
          <Card bordered={false} className="shadow-sm rounded-2xl">
            <h3 className="text-gray-800 text-lg font-semibold mb-6">Traffic Analytics</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#722ED1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#722ED1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                    cursor={{stroke: '#722ED1', strokeWidth: 1, strokeDasharray: '4 4'}}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#722ED1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
