import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Menu, X, Search, Bell, User, Settings, LogOut,
  ShoppingCart, Package, TrendingUp, Users, Leaf,
  ChevronDown, Filter, Plus, MoreVertical, Eye,
  Download, Upload, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('thisMonth');

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 50000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 50000 },
    { month: 'May', revenue: 55000, target: 50000 },
    { month: 'Jun', revenue: 67000, target: 50000 },
  ];

  const categoryData = [
    { name: 'Organic Food', value: 35, fill: '#2D6A4F' },
    { name: 'Eco Products', value: 25, fill: '#40916C' },
    { name: 'Fair Trade', value: 20, fill: '#8B6F47' },
    { name: 'Others', value: 20, fill: '#D4A574' },
  ];

  const sustainabilityMetrics = [
    { name: 'Week 1', carbon: 120, ethical: 85 },
    { name: 'Week 2', carbon: 145, ethical: 92 },
    { name: 'Week 3', carbon: 168, ethical: 95 },
    { name: 'Week 4', carbon: 192, ethical: 98 },
  ];

  const topProducts = [
    { id: 1, name: 'Organic Green Tea', sales: 1245, revenue: '$12,450', stock: 145, score: 9.5 },
    { id: 2, name: 'Eco Bamboo Set', sales: 892, revenue: '$8,920', stock: 234, score: 9.2 },
    { id: 3, name: 'Fair Trade Coffee', sales: 756, revenue: '$11,340', stock: 89, score: 9.1 },
    { id: 4, name: 'Sustainable Packaging', sales: 645, revenue: '$6,450', stock: 567, score: 8.8 },
  ];

  const metricCard = (title, value, unit, trend, trendValue, icon, color) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          trend === 'up' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}%
        </span>
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-gray-500">{unit}</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 fixed h-full z-40`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            {sidebarOpen && <span className="font-bold text-lg text-gray-900">Prana Earth</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {[
            { icon: <BarChart size={20} />, label: 'Dashboard', id: 'overview' },
            { icon: <Package size={20} />, label: 'Products', id: 'products' },
            { icon: <ShoppingCart size={20} />, label: 'Orders', id: 'orders' },
            { icon: <Users size={20} />, label: 'Customers', id: 'customers' },
            { icon: <Leaf size={20} />, label: 'Sustainability', id: 'sustainability' },
            { icon: <TrendingUp size={20} />, label: 'Analytics', id: 'analytics' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-4 border-t border-gray-200" />

        {/* Settings */}
        <nav className="p-4 space-y-2">
          {[
            { icon: <Settings size={20} />, label: 'Settings', id: 'settings' },
          ].map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {item.icon}
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-4 py-2 w-64">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders..."
                className="bg-transparent outline-none ml-2 w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-md transition-shadow">
              QA
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back! Here's your business performance overview.</p>
                </div>
                <div className="flex gap-3">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer hover:bg-gray-50"
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisYear">This Year</option>
                  </select>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                    <Download size={18} />
                    Export Report
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCard(
                  'Total Orders',
                  '2,543',
                  'This month',
                  'up',
                  '12.5',
                  <ShoppingCart size={24} className="text-green-600" />,
                  'green'
                )}
                {metricCard(
                  'Total Revenue',
                  '$67,250',
                  'This month',
                  'up',
                  '8.3',
                  <TrendingUp size={24} className="text-blue-600" />,
                  'blue'
                )}
                {metricCard(
                  'Active Products',
                  '542',
                  'In catalog',
                  'up',
                  '5.2',
                  <Package size={24} className="text-amber-600" />,
                  'amber'
                )}
                {metricCard(
                  'Customer Satisfaction',
                  '4.8/5.0',
                  'Average NPS',
                  'up',
                  '2.1',
                  <Users size={24} className="text-purple-600" />,
                  'purple'
                )}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="month" stroke="#757575" />
                      <YAxis stroke="#757575" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E0E0E0', borderRadius: '8px' }}
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2D6A4F"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sustainability Impact */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Sustainability Impact</h3>
                  <Leaf size={24} className="text-green-600" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sustainabilityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="name" stroke="#757575" />
                    <YAxis stroke="#757575" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E0E0E0', borderRadius: '8px' }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="carbon"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      dot={{ fill: '#2D6A4F', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Carbon Saved (kg)"
                    />
                    <Line
                      type="monotone"
                      dataKey="ethical"
                      stroke="#40916C"
                      strokeWidth={2}
                      dot={{ fill: '#40916C', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Ethical Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Top Performing Products</h3>
                  <button className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2">
                    View All <ChevronDown size={16} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sales</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Revenue</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Eco Score</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => (
                        <tr key={product.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{product.sales}</td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">{product.revenue}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{product.stock} units</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                              {product.score}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button className="text-gray-400 hover:text-gray-600">
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600 mt-1">Manage your product catalog and inventory</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  <Plus size={18} />
                  Add Product
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Filter size={18} />
                  Filter
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                      <Package size={48} className="text-green-300" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Product {i}</h3>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-green-600">$29.99</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                      </div>
                      <button className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        Edit Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600 mt-1">Track and manage all customer orders</p>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Orders', value: '2,543', color: 'blue' },
                  { label: 'Pending', value: '125', color: 'yellow' },
                  { label: 'Shipped', value: '856', color: 'purple' },
                  { label: 'Delivered', value: '1,562', color: 'green' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-${stat.color}-50 rounded-lg p-4 border border-${stat.color}-200`}>
                    <p className={`text-${stat.color}-700 text-sm font-medium`}>{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color}-900 mt-2`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: '#ORD-2024', customer: 'John Smith', date: 'Mar 15, 2024', amount: '$125.99', status: 'Shipped' },
                      { id: '#ORD-2023', customer: 'Sarah Johnson', date: 'Mar 14, 2024', amount: '$89.50', status: 'Delivered' },
                      { id: '#ORD-2022', customer: 'Mike Wilson', date: 'Mar 13, 2024', amount: '$234.00', status: 'Pending' },
                      { id: '#ORD-2021', customer: 'Emily Brown', date: 'Mar 12, 2024', amount: '$67.25', status: 'Delivered' },
                    ].map((order) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.customer}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">{order.amount}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-green-600 hover:text-green-700 font-medium">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                <p className="text-gray-600 mt-1">Manage customer profiles and interactions</p>
              </div>

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900">8,542</p>
                  <p className="text-xs text-gray-500 mt-2">↑ 12% from last month</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">New This Month</p>
                  <p className="text-3xl font-bold text-green-600">342</p>
                  <p className="text-xs text-gray-500 mt-2">Active signups</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Average Spend</p>
                  <p className="text-3xl font-bold text-amber-600">$156.50</p>
                  <p className="text-xs text-gray-500 mt-2">Per customer</p>
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Orders</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Lifetime Value</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Alice Chen', email: 'alice@example.com', orders: 8, value: '$1,245', status: 'Premium' },
                      { name: 'Bob Martinez', email: 'bob@example.com', orders: 5, value: '$892', status: 'Regular' },
                      { name: 'Carol Davidson', email: 'carol@example.com', orders: 12, value: '$2,156', status: 'VIP' },
                      { name: 'David Park', email: 'david@example.com', orders: 3, value: '$456', status: 'Regular' },
                    ].map((customer) => (
                      <tr key={customer.name} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{customer.orders}</td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">{customer.value}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            customer.status === 'VIP'
                              ? 'bg-purple-100 text-purple-700'
                              : customer.status === 'Premium'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sustainability Tab */}
          {activeTab === 'sustainability' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sustainability Dashboard</h1>
                <p className="text-gray-600 mt-1">Track environmental and ethical impact metrics</p>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
                  <Leaf size={28} className="text-green-600 mb-4" />
                  <p className="text-green-700 text-sm font-medium mb-1">Carbon Saved</p>
                  <p className="text-3xl font-bold text-green-900">2,450</p>
                  <p className="text-xs text-green-700 mt-2">kg CO₂ this month</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
                  <CheckCircle size={28} className="text-blue-600 mb-4" />
                  <p className="text-blue-700 text-sm font-medium mb-1">Ethical Score</p>
                  <p className="text-3xl font-bold text-blue-900">94%</p>
                  <p className="text-xs text-blue-700 mt-2">Certified products</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6">
                  <TrendingUp size={28} className="text-amber-600 mb-4" />
                  <p className="text-amber-700 text-sm font-medium mb-1">Growth Rate</p>
                  <p className="text-3xl font-bold text-amber-900">23%</p>
                  <p className="text-xs text-amber-700 mt-2">Sustainable products</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
                  <Users size={28} className="text-purple-600 mb-4" />
                  <p className="text-purple-700 text-sm font-medium mb-1">Community Impact</p>
                  <p className="text-3xl font-bold text-purple-900">5,420</p>
                  <p className="text-xs text-purple-700 mt-2">Lives supported</p>
                </div>
              </div>

              {/* Certification Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Certification Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { cert: 'Organic', count: 234 },
                    { cert: 'Fair Trade', count: 189 },
                    { cert: 'Carbon Neutral', count: 156 },
                    { cert: 'Vegan', count: 142 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="cert" stroke="#757575" />
                    <YAxis stroke="#757575" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E0E0E0', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#2D6A4F" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive business intelligence and insights</p>
              </div>

              {/* Conversion Funnel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Conversion Funnel</h3>
                  {[
                    { label: 'Visitors', value: 45230, percent: 100 },
                    { label: 'Product Views', value: 34152, percent: 75 },
                    { label: 'Add to Cart', value: 12480, percent: 28 },
                    { label: 'Completed Purchase', value: 2543, percent: 5.6 },
                  ].map((item, index) => (
                    <div key={item.label} className="mb-6 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        <span className="text-sm font-bold text-gray-900">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.percent}%</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Retention</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Month 1', retention: 100 },
                      { month: 'Month 2', retention: 82 },
                      { month: 'Month 3', retention: 71 },
                      { month: 'Month 4', retention: 65 },
                      { month: 'Month 5', retention: 58 },
                      { month: 'Month 6', retention: 52 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="month" stroke="#757575" />
                      <YAxis stroke="#757575" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value) => `${value}%`} />
                      <Line type="monotone" dataKey="retention" stroke="#2D6A4F" strokeWidth={3} dot={{ fill: '#2D6A4F', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Traffic Sources</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { source: 'Organic', visitors: 12500 },
                    { source: 'Direct', visitors: 8900 },
                    { source: 'Social', visitors: 7650 },
                    { source: 'Referral', visitors: 6200 },
                    { source: 'Paid', visitors: 9800 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="source" stroke="#757575" />
                    <YAxis stroke="#757575" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value) => value.toLocaleString()} />
                    <Bar dataKey="visitors" fill="#40916C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
