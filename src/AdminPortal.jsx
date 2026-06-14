import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Home,
  Package,
  BarChart3,
  Users,
  FileText,
  Globe,
  Zap,
  Leaf,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Edit2,
  Trash2,
  Eye,
  Plus,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from 'react-icons/md';

/**
 * ADMIN PORTAL - PRANA EARTH
 * Integrated Marketplace & Predict Model Dashboard
 * Built with sustainability metrics, predictive analytics, and commerce management
 */

// ============================================
// DESIGN TOKENS & CONSTANTS
// ============================================
const COLORS = {
  primary: '#2D6A4F',
  primaryDark: '#1F4D38',
  accentGreen: '#40916C',
  earthBrown: '#8B6F47',
  lightSage: '#E8F3ED',
  success: '#2D6A4F',
  warning: '#D4A574',
  error: '#C1563F',
  info: '#4A7C9E',
  black: '#1A1A1A',
  darkGray: '#424242',
  mediumGray: '#757575',
  lightGray: '#E0E0E0',
  white: '#FFFFFF',
  darkBg: '#121212',
  darkSurface: '#1E1E1E',
};

const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
};

// ============================================
// MOCK DATA
// ============================================
const mockAdminData = {
  metrics: {
    totalRevenue: 2456890,
    totalOrders: 12543,
    activeListings: 3456,
    customerSatisfaction: 4.7,
    carbonSaved: 15234,
    ethicalProductsCount: 892,
  },
  recentOrders: [
    {
      id: 'ORD-001',
      customer: 'Sarah Johnson',
      product: 'Organic Cotton T-Shirt',
      amount: 45.99,
      status: 'delivered',
      date: '2024-06-14',
      sustainability: 8.5,
    },
    {
      id: 'ORD-002',
      customer: 'Michael Chen',
      product: 'Bamboo Cutting Board Set',
      amount: 89.99,
      status: 'processing',
      date: '2024-06-14',
      sustainability: 9.2,
    },
    {
      id: 'ORD-003',
      customer: 'Emma Davis',
      product: 'Recycled Plastic Chair',
      amount: 234.50,
      status: 'pending',
      date: '2024-06-13',
      sustainability: 7.8,
    },
  ],
  predictAssets: [
    {
      id: 'AST-001',
      name: 'Data Center - Mumbai',
      type: 'Data Center',
      location: 'Mumbai, India',
      riskScore: 7.2,
      status: 'assessed',
      climateRisks: ['Heat Stress', 'Water Scarcity'],
      esgScore: 68,
      carbonFootprint: 1250,
    },
    {
      id: 'AST-002',
      name: 'Manufacturing Unit - Delhi',
      type: 'Manufacturing Unit',
      location: 'Delhi, India',
      riskScore: 5.8,
      status: 'pending',
      climateRisks: ['Air Quality', 'Power Disruption'],
      esgScore: 72,
      carbonFootprint: 2100,
    },
    {
      id: 'AST-003',
      name: 'Warehouse - Bangalore',
      type: 'Warehouse',
      location: 'Bangalore, India',
      riskScore: 4.2,
      status: 'assessed',
      climateRisks: ['Flood Risk'],
      esgScore: 81,
      carbonFootprint: 850,
    },
  ],
  sustainabilityMetrics: {
    carbonSavedThisMonth: 2345,
    carbonSavedTotal: 15234,
    ethicalPartnersOnboarded: 45,
    communityImpact: {
      jobsCreated: 234,
      artisansSupported: 156,
      communitiesReached: 12,
    },
  },
};

// ============================================
// DASHBOARD HEADER COMPONENT
// ============================================
const DashboardHeader = ({ darkMode, setDarkMode, setActiveMenu }) => (
  <header
    style={{
      background: darkMode ? COLORS.darkSurface : COLORS.white,
      borderBottom: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
      padding: `${SPACING.md} ${SPACING.lg}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
      <button
        onClick={() => setActiveMenu((prev) => !prev)}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: darkMode ? COLORS.white : COLORS.black,
          display: 'none',
        }}
      >
        <Menu />
      </button>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: COLORS.primary,
          margin: 0,
        }}
      >
        🌍 Prana Earth
      </h1>
      <span
        style={{
          fontSize: '12px',
          color: COLORS.mediumGray,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        Admin Portal
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: darkMode ? COLORS.darkBg : COLORS.lightGray,
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderRadius: '4px',
          width: '280px',
          border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
        }}
      >
        <Search size={16} color={COLORS.mediumGray} />
        <input
          type="text"
          placeholder="Search orders, assets, products..."
          style={{
            background: 'transparent',
            border: 'none',
            marginLeft: SPACING.sm,
            flex: 1,
            fontSize: '14px',
            color: darkMode ? COLORS.white : COLORS.black,
            outline: 'none',
          }}
        />
      </div>

      {/* Notifications */}
      <button
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: darkMode ? COLORS.white : COLORS.black,
          position: 'relative',
        }}
      >
        <Bell />
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: COLORS.error,
            color: COLORS.white,
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          3
        </span>
      </button>

      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: darkMode ? COLORS.white : COLORS.black,
        }}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Profile Dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          paddingLeft: SPACING.md,
          borderLeft: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: COLORS.accentGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.white,
            fontWeight: 700,
          }}
        >
          AD
        </div>
        <ChevronDown size={16} color={COLORS.mediumGray} />
      </div>
    </div>
  </header>
);

// ============================================
// SIDEBAR NAVIGATION COMPONENT
// ============================================
const Sidebar = ({ darkMode, activeTab, setActiveTab, collapsed }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: Zap },
    { id: 'predict', label: 'Predict Models', icon: TrendingUp },
    { id: 'assets', label: 'Assets', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      style={{
        background: darkMode ? COLORS.darkBg : COLORS.white,
        borderRight: `1px solid ${darkMode ? COLORS.darkSurface : COLORS.lightGray}`,
        width: collapsed ? '80px' : '240px',
        padding: `${SPACING.lg} 0`,
        position: 'fixed',
        left: 0,
        top: '70px',
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        transition: 'all 0.3s ease-out',
      }}
    >
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                background:
                  activeTab === item.id
                    ? darkMode
                      ? 'rgba(45, 106, 79, 0.2)'
                      : COLORS.lightSage
                    : 'transparent',
                border: 'none',
                padding: `${SPACING.md} ${SPACING.lg}`,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                cursor: 'pointer',
                color:
                  activeTab === item.id
                    ? COLORS.primary
                    : darkMode
                      ? COLORS.white
                      : COLORS.darkGray,
                borderLeft:
                  activeTab === item.id
                    ? `4px solid ${COLORS.primary}`
                    : '4px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === item.id ? 600 : 500,
                transition: 'all 0.2s ease-out',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          cursor: 'pointer',
          color: COLORS.error,
          fontSize: '14px',
          fontWeight: 500,
          marginTop: SPACING.xl,
          borderTop: `1px solid ${darkMode ? COLORS.darkSurface : COLORS.lightGray}`,
        }}
      >
        <LogOut size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
};

// ============================================
// METRIC CARD COMPONENT
// ============================================
const MetricCard = ({ darkMode, title, value, subtitle, icon: Icon, trend, trendValue, color = COLORS.primary }) => (
  <div
    style={{
      background: darkMode ? COLORS.darkSurface : COLORS.white,
      border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
      borderRadius: '8px',
      padding: SPACING.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.sm,
      transition: 'all 0.3s ease-out',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p
          style={{
            fontSize: '12px',
            color: COLORS.mediumGray,
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: 0,
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </p>
        <h3
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: darkMode ? COLORS.white : COLORS.black,
            margin: `${SPACING.sm} 0 0 0`,
          }}
        >
          {typeof value === 'number' && value > 1000
            ? `${(value / 1000).toFixed(1)}K`
            : value}
        </h3>
      </div>
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        <Icon size={24} />
      </div>
    </div>

    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm }}>
        {trend === 'up' ? (
          <ArrowUpRight size={16} color={COLORS.success} />
        ) : (
          <ArrowDownLeft size={16} color={COLORS.error} />
        )}
        <span
          style={{
            fontSize: '12px',
            color: trend === 'up' ? COLORS.success : COLORS.error,
            fontWeight: 600,
          }}
        >
          {trendValue}% from last month
        </span>
      </div>
    )}

    {subtitle && (
      <p
        style={{
          fontSize: '12px',
          color: COLORS.mediumGray,
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

// ============================================
// DASHBOARD TAB COMPONENT
// ============================================
const DashboardTab = ({ darkMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
    {/* Key Metrics Grid */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: SPACING.lg,
      }}
    >
      <MetricCard
        darkMode={darkMode}
        title="Total Revenue"
        value={`$${(mockAdminData.metrics.totalRevenue / 1000).toFixed(0)}K`}
        icon={DollarSign}
        trend="up"
        trendValue="12.5"
        subtitle="This month"
      />
      <MetricCard
        darkMode={darkMode}
        title="Total Orders"
        value={mockAdminData.metrics.totalOrders}
        icon={Package}
        trend="up"
        trendValue="8.2"
        subtitle="All time"
      />
      <MetricCard
        darkMode={darkMode}
        title="Active Listings"
        value={mockAdminData.metrics.activeListings}
        icon={ShoppingCart}
        trend="up"
        trendValue="5.3"
        color={COLORS.accentGreen}
        subtitle="Products"
      />
      <MetricCard
        darkMode={darkMode}
        title="Customer Satisfaction"
        value={mockAdminData.metrics.customerSatisfaction}
        icon={CheckCircle}
        trend="up"
        trendValue="2.1"
        color={COLORS.success}
        subtitle="Out of 5 stars"
      />
      <MetricCard
        darkMode={darkMode}
        title="Carbon Saved"
        value={`${mockAdminData.metrics.carbonSaved}kg`}
        icon={Leaf}
        trend="up"
        trendValue="15.8"
        color={COLORS.accentGreen}
        subtitle="Total impact"
      />
      <MetricCard
        darkMode={darkMode}
        title="Ethical Products"
        value={mockAdminData.metrics.ethicalProductsCount}
        icon={CheckCircle}
        trend="up"
        trendValue="3.4"
        color={COLORS.earthBrown}
        subtitle="On platform"
      />
    </div>

    {/* Recent Orders Section */}
    <div
      style={{
        background: darkMode ? COLORS.darkSurface : COLORS.white,
        border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
        borderRadius: '8px',
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.lg,
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: darkMode ? COLORS.white : COLORS.black,
            margin: 0,
          }}
        >
          Recent Orders
        </h3>
        <a
          href="#"
          style={{
            color: COLORS.primary,
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          View All →
        </a>
      </div>

      <div
        style={{
          overflowX: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
              }}
            >
              {['Order ID', 'Customer', 'Product', 'Amount', 'Status', 'Sustainability'].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: `${SPACING.md} 0`,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: COLORS.mediumGray,
                      textTransform: 'uppercase',
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {mockAdminData.recentOrders.map((order) => (
              <tr
                key={order.id}
                style={{
                  borderBottom: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
                  transition: 'background 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode
                    ? 'rgba(45, 106, 79, 0.1)'
                    : COLORS.lightSage;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COLORS.primary,
                  }}
                >
                  {order.id}
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    color: darkMode ? COLORS.white : COLORS.black,
                  }}
                >
                  {order.customer}
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    color: COLORS.mediumGray,
                  }}
                >
                  {order.product}
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: darkMode ? COLORS.white : COLORS.black,
                  }}
                >
                  ${order.amount}
                </td>
                <td style={{ padding: `${SPACING.md} 0` }}>
                  <span
                    style={{
                      padding: `${SPACING.xs} ${SPACING.md}`,
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background:
                        order.status === 'delivered'
                          ? 'rgba(45, 106, 79, 0.1)'
                          : order.status === 'processing'
                            ? 'rgba(212, 165, 116, 0.1)'
                            : 'rgba(193, 85, 63, 0.1)',
                      color:
                        order.status === 'delivered'
                          ? COLORS.success
                          : order.status === 'processing'
                            ? COLORS.warning
                            : COLORS.error,
                    }}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COLORS.accentGreen,
                  }}
                >
                  {order.sustainability}/10
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ============================================
// MARKETPLACE TAB COMPONENT
// ============================================
const MarketplaceTab = ({ darkMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: darkMode ? COLORS.white : COLORS.black,
          margin: 0,
        }}
      >
        Marketplace Management
      </h2>
      <button
        style={{
          background: COLORS.primary,
          color: COLORS.white,
          border: 'none',
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          transition: 'all 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = COLORS.primaryDark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = COLORS.primary;
        }}
      >
        <Plus size={18} /> Add Product
      </button>
    </div>

    {/* Marketplace Overview Cards */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: SPACING.lg,
      }}
    >
      <MetricCard
        darkMode={darkMode}
        title="Products Listed"
        value="2,456"
        icon={Package}
        trend="up"
        trendValue="4.2"
      />
      <MetricCard
        darkMode={darkMode}
        title="Total Sales"
        value="$456.2K"
        icon={DollarSign}
        trend="up"
        trendValue="18.5"
      />
      <MetricCard
        darkMode={darkMode}
        title="Vendors Active"
        value="234"
        icon={Users}
        trend="up"
        trendValue="6.3"
      />
      <MetricCard
        darkMode={darkMode}
        title="Conversion Rate"
        value="3.8%"
        icon={TrendingUp}
        trend="up"
        trendValue="0.5"
      />
    </div>

    {/* Product Categories */}
    <div
      style={{
        background: darkMode ? COLORS.darkSurface : COLORS.white,
        border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
        borderRadius: '8px',
        padding: SPACING.lg,
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: darkMode ? COLORS.white : COLORS.black,
          margin: `0 0 ${SPACING.lg} 0`,
        }}
      >
        Top Product Categories
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: SPACING.lg,
        }}
      >
        {[
          { name: 'Organic Food', count: 456, sales: '$125.6K' },
          { name: 'Eco Fashion', count: 789, sales: '$234.9K' },
          { name: 'Home & Living', count: 623, sales: '$156.3K' },
          { name: 'Beauty & Care', count: 534, sales: '$98.7K' },
        ].map((category) => (
          <div
            key={category.name}
            style={{
              padding: SPACING.md,
              borderRadius: '8px',
              background: darkMode ? COLORS.darkBg : COLORS.lightSage,
              border: `1px solid ${darkMode ? COLORS.darkBg : 'transparent'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: COLORS.primary,
                margin: 0,
              }}
            >
              {category.name}
            </h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: COLORS.mediumGray,
                }}
              >
                {category.count} products
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: darkMode ? COLORS.white : COLORS.black,
                }}
              >
                {category.sales}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// PREDICT MODELS TAB COMPONENT
// ============================================
const PredictModelsTab = ({ darkMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: darkMode ? COLORS.white : COLORS.black,
          margin: 0,
        }}
      >
        Climate & ESG Intelligence
      </h2>
      <button
        style={{
          background: COLORS.primary,
          color: COLORS.white,
          border: 'none',
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        <Plus size={18} /> New Assessment
      </button>
    </div>

    {/* Sustainability Impact Overview */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: SPACING.lg,
      }}
    >
      <MetricCard
        darkMode={darkMode}
        title="Total Assets Assessed"
        value={mockAdminData.predictAssets.length}
        icon={Globe}
        trend="up"
        trendValue="25.0"
      />
      <MetricCard
        darkMode={darkMode}
        title="Avg Risk Score"
        value="5.7/10"
        icon={AlertCircle}
        trend="down"
        trendValue="3.2"
        color={COLORS.warning}
      />
      <MetricCard
        darkMode={darkMode}
        title="Carbon Footprint Total"
        value="4.2K tons"
        icon={Leaf}
        trend="down"
        trendValue="5.1"
        color={COLORS.success}
      />
      <MetricCard
        darkMode={darkMode}
        title="ESG Score Avg"
        value="73.7/100"
        icon={CheckCircle}
        trend="up"
        trendValue="8.2"
        color={COLORS.accentGreen}
      />
    </div>

    {/* Asset Climate Risk Dashboard */}
    <div
      style={{
        background: darkMode ? COLORS.darkSurface : COLORS.white,
        border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
        borderRadius: '8px',
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.lg,
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: darkMode ? COLORS.white : COLORS.black,
            margin: 0,
          }}
        >
          Asset Climate Risk Analysis
        </h3>
        <select
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            borderRadius: '4px',
            border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
            background: darkMode ? COLORS.darkBg : COLORS.white,
            color: darkMode ? COLORS.white : COLORS.black,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option>All Regions</option>
          <option>Asia-Pacific</option>
          <option>Europe</option>
          <option>Americas</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
              }}
            >
              {['Asset Name', 'Location', 'Type', 'Risk Score', 'Status', 'ESG Score', 'Carbon'].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: `${SPACING.md} 0`,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: COLORS.mediumGray,
                      textTransform: 'uppercase',
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {mockAdminData.predictAssets.map((asset) => (
              <tr
                key={asset.id}
                style={{
                  borderBottom: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode
                    ? 'rgba(45, 106, 79, 0.1)'
                    : COLORS.lightSage;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: darkMode ? COLORS.white : COLORS.black,
                  }}
                >
                  {asset.name}
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    color: COLORS.mediumGray,
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                  }}
                >
                  <MapPin size={14} /> {asset.location}
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    color: darkMode ? COLORS.white : COLORS.black,
                  }}
                >
                  {asset.type}
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      padding: `${SPACING.xs} ${SPACING.md}`,
                      borderRadius: '4px',
                      background:
                        asset.riskScore > 6.5
                          ? 'rgba(193, 85, 63, 0.1)'
                          : asset.riskScore > 4
                            ? 'rgba(212, 165, 116, 0.1)'
                            : 'rgba(45, 106, 79, 0.1)',
                      color:
                        asset.riskScore > 6.5
                          ? COLORS.error
                          : asset.riskScore > 4
                            ? COLORS.warning
                            : COLORS.success,
                    }}
                  >
                    {asset.riskScore}/10
                  </span>
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '12px',
                  }}
                >
                  <span
                    style={{
                      padding: `${SPACING.xs} ${SPACING.md}`,
                      borderRadius: '16px',
                      background:
                        asset.status === 'assessed'
                          ? 'rgba(45, 106, 79, 0.1)'
                          : 'rgba(212, 165, 116, 0.1)',
                      color:
                        asset.status === 'assessed'
                          ? COLORS.success
                          : COLORS.warning,
                      fontWeight: 600,
                    }}
                  >
                    {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                  </span>
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COLORS.accentGreen,
                  }}
                >
                  {asset.esgScore}/100
                </td>
                <td
                  style={{
                    padding: `${SPACING.md} 0`,
                    fontSize: '14px',
                    color: COLORS.mediumGray,
                  }}
                >
                  {asset.carbonFootprint} tons
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Climate Risk Distribution */}
    <div
      style={{
        background: darkMode ? COLORS.darkSurface : COLORS.white,
        border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
        borderRadius: '8px',
        padding: SPACING.lg,
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: darkMode ? COLORS.white : COLORS.black,
          margin: `0 0 ${SPACING.lg} 0`,
        }}
      >
        Climate Risks Identified
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: SPACING.lg,
        }}
      >
        {[
          { risk: 'Heat Stress', count: 3, severity: 'high', icon: '🔥' },
          { risk: 'Water Scarcity', count: 2, severity: 'high', icon: '💧' },
          { risk: 'Flood Risk', count: 1, severity: 'medium', icon: '🌊' },
          { risk: 'Air Quality', count: 2, severity: 'high', icon: '💨' },
        ].map((item) => (
          <div
            key={item.risk}
            style={{
              padding: SPACING.md,
              borderRadius: '8px',
              background:
                item.severity === 'high'
                  ? 'rgba(193, 85, 63, 0.1)'
                  : 'rgba(212, 165, 116, 0.1)',
              border: `1px solid ${item.severity === 'high' ? 'rgba(193, 85, 63, 0.2)' : 'rgba(212, 165, 116, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <span style={{ fontSize: '24px' }}>{item.icon}</span>
            <div>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: item.severity === 'high' ? COLORS.error : COLORS.warning,
                  margin: 0,
                }}
              >
                {item.risk}
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: COLORS.mediumGray,
                  margin: 0,
                }}
              >
                {item.count} assets affected
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// ORDERS TAB COMPONENT
// ============================================
const OrdersTab = ({ darkMode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: darkMode ? COLORS.white : COLORS.black,
          margin: 0,
        }}
      >
        Order Management
      </h2>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          alignItems: 'center',
        }}
      >
        <select
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            borderRadius: '4px',
            border: `1px solid ${darkMode ? COLORS.darkBg : COLORS.lightGray}`,
            background: darkMode ? COLORS.darkBg : COLORS.white,
            color: darkMode ? COLORS.white : COLORS.black,
            fontSize: '14px',
          }}
        >
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Shipped</option>
          <option>Delivered</option>
        </select>
      </div>
    </div>

    {/* Orders Summary */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: SPACING.lg,
      }}
    >
      <MetricCard darkMode={darkMode} title="Pending Orders" value="34" icon={Clock} color={COLORS.warning} />
      <MetricCard darkMode={darkMode} title="Processing" value="56" icon={Package} color={COLORS.info} />
      <MetricCard darkMode={darkMode} title="Ready to Ship" value="23" icon={Zap} color={COLORS.accentGreen} />
      <MetricCard darkMode={darkMode} title="Avg Processing Time" value="2.3h" icon={Calendar} />
    </div>
  </div>
);

// ============================================
// MAIN ADMIN PORTAL COMPONENT
// ============================================
const AdminPortal = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab darkMode={darkMode} />;
      case 'marketplace':
        return <MarketplaceTab darkMode={darkMode} />;
      case 'predict':
        return <PredictModelsTab darkMode={darkMode} />;
      case 'orders':
        return <OrdersTab darkMode={darkMode} />;
      default:
        return (
          <div
            style={{
              padding: SPACING.lg,
              background: darkMode ? COLORS.darkSurface : COLORS.white,
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                color: COLORS.mediumGray,
              }}
            >
              {activeTab.toUpperCase()} section coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        background: darkMode ? COLORS.darkBg : '#FAFAFA',
        color: darkMode ? COLORS.white : COLORS.black,
        minHeight: '100vh',
        fontFamily: '"Inter", "Open Sans", sans-serif',
      }}
    >
      {/* Header */}
      <DashboardHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setActiveMenu={setCollapsed}
      />

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <Sidebar
          darkMode={darkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
        />

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            marginLeft: collapsed ? '80px' : '240px',
            padding: SPACING.lg,
            transition: 'margin-left 0.3s ease-out',
          }}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPortal;
