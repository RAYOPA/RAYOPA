"use client";

import { Eye, DollarSign, Activity, MoreHorizontal, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const subscriberData = [
  { name: 'Sun', value: 2000 },
  { name: 'Mon', value: 2200 },
  { name: 'Tue', value: 3874 },
  { name: 'Wed', value: 1500 },
  { name: 'Thu', value: 1800 },
  { name: 'Fri', value: 2400 },
  { name: 'Sat', value: 1200 },
];

const salesDistributionData = [
  { name: 'Website', value: 374.82, color: '#5347CE' },
  { name: 'Mobile App', value: 241.60, color: '#16C8C7' },
  { name: 'Other', value: 213.42, color: '#F3F4F6' },
];

const integrationsData = [
  { app: 'Stripe', type: 'Finance', rate: 40, profit: '$650.00', icon: 'S', color: '#5347CE' },
  { app: 'Zapier', type: 'CRM', rate: 80, profit: '$720.50', icon: 'Z', color: '#F97316' },
  { app: 'Shopify', type: 'Marketplace', rate: 20, profit: '$432.25', icon: 'S', color: '#22C55E' },
  { app: 'Zoom', type: 'Technology', rate: 60, profit: '$650.00', icon: 'Z', color: '#3B82F6' },
];

export default function Dashboard() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Eye className="w-4 h-4" /> Page Views
            </div>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">12,450</h2>
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-[#16C8C7]/10 text-[#16C8C7] mb-1">
              15.8% <ArrowUp className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <DollarSign className="w-4 h-4" /> Total Revenue
            </div>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">$363.95</h2>
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-pink-100 text-pink-500 mb-1">
              34.0% <ArrowDown className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Activity className="w-4 h-4" /> Bounce Rate
            </div>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">86.5%</h2>
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-[#16C8C7]/10 text-[#16C8C7] mb-1">
              24.2% <ArrowUp className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-1">
                <Activity className="w-4 h-4" /> Sales Overview
              </div>
              <div className="flex items-end gap-3">
                <h2 className="text-2xl font-bold text-gray-900">$9,257.51</h2>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="font-semibold text-[#16C8C7]">15.8% <ArrowUp className="w-3 h-3 inline" /></span>
                  <span className="text-gray-400">+$143.50 increased</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs font-medium border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50">
                <Filter className="w-3 h-3" /> Filter
              </button>
              <button className="flex items-center gap-1 text-xs font-medium border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50">
                Sort
              </button>
              <button className="border border-gray-200 rounded-md p-1.5 hover:bg-gray-50">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Custom Stacked Bar Chart Mock */}
          <div className="h-64 mt-8 flex flex-col items-center justify-end pb-8 relative">
             <div className="w-full flex justify-around items-end h-full px-12">
                {/* Oct */}
                <div className="flex flex-col items-center gap-1 w-20">
                  <span className="text-xs font-bold text-gray-600 mb-2">$2,988.20</span>
                  <div className="w-full bg-[#16C8C7] h-2 rounded-t-sm"></div>
                  <div className="w-full bg-[#4896FE] h-10 rounded-sm"></div>
                  <div className="w-full bg-[#887CFD] h-6 rounded-sm"></div>
                  <div className="w-full bg-[#5347CE] h-8 rounded-b-sm"></div>
                  <span className="text-xs text-gray-400 mt-2">Oct</span>
                </div>
                {/* Nov */}
                <div className="flex flex-col items-center gap-1 w-20">
                  <span className="text-xs font-bold text-gray-600 mb-2">$1,765.09</span>
                  <div className="w-full bg-[#16C8C7] h-4 rounded-t-sm"></div>
                  <div className="w-full bg-[#4896FE] h-6 rounded-sm"></div>
                  <div className="w-full bg-[#887CFD] h-4 rounded-sm"></div>
                  <div className="w-full bg-[#5347CE] h-4 rounded-b-sm"></div>
                  <span className="text-xs text-gray-400 mt-2">Nov</span>
                </div>
                {/* Dec */}
                <div className="flex flex-col items-center gap-1 w-20">
                  <span className="text-xs font-bold text-gray-600 mb-2">$4,005.65</span>
                  <div className="w-full bg-[#16C8C7] h-4 rounded-t-sm"></div>
                  <div className="w-full bg-[#4896FE] h-12 rounded-sm"></div>
                  <div className="w-full bg-[#887CFD] h-8 rounded-sm"></div>
                  <div className="w-full bg-[#5347CE] h-16 rounded-b-sm"></div>
                  <span className="text-xs text-gray-400 mt-2">Dec</span>
                </div>
             </div>
             
             {/* Legend */}
             <div className="absolute bottom-0 flex items-center gap-4 text-[11px] font-medium text-gray-500">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#5347CE]"></div> China</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#887CFD]"></div> UE</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#4896FE]"></div> USA</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#16C8C7]"></div> Canada</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-gray-200"></div> Other</div>
             </div>
          </div>
        </div>

        {/* Total Subscriber */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Eye className="w-4 h-4" /> Total Subscriber
            </div>
            <select className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none">
              <option>Weekly</option>
            </select>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">24,473</h2>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="font-semibold text-[#16C8C7] px-1.5 py-0.5 rounded bg-[#16C8C7]/10">8.3% <ArrowUp className="w-3 h-3 inline" /></span>
              <span className="text-gray-400">+ 749 increased</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriberData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 4, 4]} 
                  barSize={24}
                >
                  {subscriberData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Tue' ? 'url(#colorPurpleGradient)' : '#E5E7EB'} 
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#887CFD" />
                    <stop offset="100%" stopColor="#5347CE" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Activity className="w-4 h-4" /> Sales Distribution
            </div>
            <select className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none">
              <option>Monthly</option>
            </select>
          </div>

          <div className="flex justify-between px-2 mb-8">
            <div className="text-center">
              <div className="text-[10px] font-bold text-[#5347CE] uppercase tracking-wider mb-1 flex items-center gap-1 justify-center">
                <div className="w-1.5 h-3 bg-[#5347CE] rounded-full"></div> Website
              </div>
              <div className="font-bold text-gray-900">$374.82</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-[#16C8C7] uppercase tracking-wider mb-1 flex items-center gap-1 justify-center">
                <div className="w-1.5 h-3 bg-[#16C8C7] rounded-full"></div> Mobile App
              </div>
              <div className="font-bold text-gray-900">$241.60</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Other
              </div>
              <div className="font-bold text-gray-900">$213.42</div>
            </div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center -mt-6">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={salesDistributionData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {salesDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* List of Integration */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Activity className="w-4 h-4" /> List of Integration
            </div>
            <button className="text-xs font-semibold text-[#5347CE] hover:underline">
              See All
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold pl-2 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-[#5347CE]" />
                  </th>
                  <th className="pb-3 font-semibold">Application</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Rate</th>
                  <th className="pb-3 font-semibold text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {integrationsData.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-4 pl-2">
                      <input type="checkbox" className="rounded border-gray-300 text-[#5347CE]" />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.icon}
                        </div>
                        <span className="font-semibold text-gray-800">{item.app}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-500 font-medium">{item.type}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3 w-40">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${item.rate}%`, backgroundColor: '#5347CE' }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8">{item.rate}%</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-semibold text-gray-800">{item.profit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
