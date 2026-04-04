import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkshopContext } from "../Context";
import axios from "axios";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PackageSearch, TrendingUp, TrendingDown, IndianRupee, Bell, ArrowRight, Layers, Users, Zap, BrainCircuit, Sparkles, ArrowUpRight, ArrowDownRight, Wallet, Info } from "lucide-react";

import toast from "react-hot-toast";

export default function Dashboard() {
  const { loca } = useContext(WorkshopContext);
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isNotificationActive, setIsNotificationActive] = useState(
    "Notification" in window && Notification.permission === "granted"
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salesRes, purchRes, invRes, suppRes, prodRes] = await Promise.all([
          axios.get(`${loca}/sales`),
          axios.get(`${loca}/purchases`),
          axios.get(`${loca}/inventories`),
          axios.get(`${loca}/suppliers`),
          axios.get(`${loca}/productions`)
        ]);

        setSales(salesRes.data?.data || []);
        setPurchases(purchRes.data?.data || []);
        setInventory(invRes.data?.data || []);
        setSuppliers(suppRes.data?.data || []);
        setProduction(prodRes.data?.data || []);
      } catch (err) {
        console.error("Failed fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loca]);

  // Calculations for KPI Cards
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalSpend = purchases.reduce((sum, p) => sum + p.amount, 0);
  const cashFlow = totalRevenue - totalSpend;
  const inventoryValue = inventory.reduce((sum, i) => sum + (parseFloat(i.quantity || 0) * parseFloat(i.rate || 0)), 0);
  const businessEquity = cashFlow + inventoryValue;
  const totalProductionWeight = production.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);
  const totalPurchaseWeight = purchases.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);

  // NEW Monthly Trend Calculation (Last 6 Months)
  const calculateFinancialChartData = () => {
    const dataMap = {};

    // Process last 6 months
    [...purchases, ...sales].forEach(item => {
      const monthKey = item.recordMonth; // "YYYY-MM"
      if (!dataMap[monthKey]) {
        const d = new Date(monthKey + "-01");
        dataMap[monthKey] = {
          month: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          revenue: 0,
          spend: 0,
          sortKey: monthKey
        };
      }
      if (item.vendorName) dataMap[monthKey].revenue += item.amount;
      else if (item.supplierName) dataMap[monthKey].spend += item.amount;
    });

    return Object.values(dataMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6); // Last 6 months trend
  };

  const chartData = calculateFinancialChartData();

  const todayDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  // Calculate upcoming 7 days (including month wrap)
  const upcomingWindow = Array.from({ length: 7 }, (_, i) => {
    let d = todayDay + i;
    return d > daysInMonth ? d - daysInMonth : d;
  });

  const upcomingCollections = suppliers.filter(s => upcomingWindow.includes(s.collectionDate))
    .sort((a, b) => {
      // Sort by proximity
      const aIdx = upcomingWindow.indexOf(a.collectionDate);
      const bIdx = upcomingWindow.indexOf(b.collectionDate);
      return aIdx - bIdx;
    });

  // Month calculation for comparison
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getUTCMonth() - 1);
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

  // Partner Comparison Data (Current vs Last Month)
  const getPartnerComparisonData = () => {
    const partners = {};

    [...sales, ...purchases].forEach(item => {
      const name = item.vendorName || item.supplierName;
      const month = item.recordMonth;
      if (!partners[name]) partners[name] = { name, current: 0, previous: 0 };

      if (month === currentMonthStr) partners[name].current += item.amount;
      else if (month === lastMonthStr) partners[name].previous += item.amount;
    });

    return Object.values(partners)
      .filter(p => p.current > 0 || p.previous > 0)
      .map(p => {
        const growth = p.previous > 0 ? ((p.current - p.previous) / p.previous) * 100 : 100;
        let status = "Consistent";
        let statusColor = "primary";
        if (parseFloat(growth) > 30) { status = "High Growth"; statusColor = "success"; }
        else if (parseFloat(growth) < -10) { status = "Declining"; statusColor = "danger"; }

        return { ...p, growth: growth.toFixed(1), status, statusColor };
      })
      .sort((a, b) => b.current - a.current)
      .slice(0, 5); // Top 5 partners
  };

  // Material Distribution Data (Full Inventory by Weight)
  const getMaterialDistributionData = () => {
    return inventory
      .map(i => ({
        name: i.materialName,
        value: parseFloat(i.quantity || 0)
      }))
      .filter(item => item.value > 0);
  };

  const comparisonData = getPartnerComparisonData();
  const distributionData = getMaterialDistributionData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#64748b'];

  // Professional BI Insights Logic
  const getInventoryInsights = () => {
    return inventory.map(item => {
      const avgPurchaseRate = item.rate || 0;
      const currentBenchRate = 50; // In real app, this would be a market feed. Here we use a heuristic.
      const potentialProfit = (parseFloat(item.quantity) * (avgPurchaseRate * 1.15)) - (parseFloat(item.quantity) * avgPurchaseRate);
      const margin = 15; // Mocking a 15% historical margin growth for these items

      let strategy = "LIQUIDATE"; // Default
      let advice = "Sell fast to free up cash.";
      let color = "danger";

      // Logic: If it's a high value item (like Copper/Brass) or we have low stock, suggest HOLDING
      if (parseFloat(item.quantity) > 0 && (item.materialName.toLowerCase().includes('copper') || item.materialName.toLowerCase().includes('brass') || avgPurchaseRate > 100)) {
        strategy = "HOLD FOR GAIN";
        advice = "Prices historicaly trend up. Store for 3-6 months.";
        color = "success";
      } else if (parseFloat(item.quantity) < 500) {
        strategy = "ACCUMULATE";
        advice = "Stock is low. Buy more to build inventory.";
        color = "primary";
      }

      return {
        ...item,
        strategy,
        advice,
        color,
        potentialProfit: potentialProfit.toFixed(0),
        marginFormatted: `+${margin}%`
      };
    }).filter(i => parseFloat(i.quantity) > 0).sort((a, b) => b.potentialProfit - a.potentialProfit).slice(0, 3);
  };

  const insights = getInventoryInsights();
  const liquidityRatio = totalSpend > 0 ? ((inventoryValue / (totalSpend + inventoryValue)) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-success" style={{ width: "3rem", height: "3rem" }}></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">

      {/* ALERTS / NOTIFICATIONS */}
      {upcomingCollections.length > 0 && (
        <div className="alert border-0 border-indigo border-start border-4 shadow-sm mb-5 d-flex flex-column flex-md-row align-items-center justify-content-between bg-white" style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center gap-3 gap-md-4 mb-3 mb-md-0">
            <div className="bg-indigo-50 p-2 p-md-3 rounded-4">
              <Zap className="text-indigo-600" size={24} />
            </div>
            <div>
              <h5 className="fw-bold mb-1 text-dark smaller-md">Weekly Strategy: Upcoming Stock Collections</h5>
              <p className="mb-2 text-muted smaller opacity-75">Scheduled for collection within the next 7 days:</p>
              <div className="d-flex flex-wrap gap-2">
                {upcomingCollections.map(s => {
                  const today = new Date();
                  const currentMonth = today.getMonth();
                  const currentYear = today.getFullYear();

                  // Logic: If the collection day is less than today's day, it's in the next month
                  let targetMonth = currentMonth;
                  if (s.collectionDate < today.getDate()) {
                    targetMonth += 1;
                  }

                  const targetDate = new Date(currentYear, targetMonth, s.collectionDate);
                  const formattedDate = targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                  return (
                    <div key={s.id} className="badge bg-light text-dark border px-2 px-md-3 py-2 rounded-pill d-flex align-items-center gap-2">
                      <span className={`p-1 rounded-circle ${s.collectionDate === todayDay ? 'bg-danger' : 'bg-success'}`} style={{ width: 8, height: 8 }}></span>
                      <span className="smaller">{s.name}</span> <span className="text-muted fw-bold smaller-xs">{formattedDate}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="d-flex flex-column align-items-md-end gap-2 w-100 w-md-auto mt-2 mt-md-0">
            <div className="form-check form-switch bg-light px-3 py-1 py-md-2 rounded-pill border d-flex align-items-center gap-2 shadow-sm">
              <label className="form-check-label smaller-xs fw-black text-dark text-uppercase tracking-widest cursor-pointer m-0" htmlFor="alertToggle" style={{ fontSize: '0.6rem' }}>
                Stay Notified
              </label>
              <input
                className="form-check-input cursor-pointer m-0"
                type="checkbox"
                id="alertToggle"
                checked={isNotificationActive}
                onChange={async (e) => {
                  if (!("Notification" in window)) {
                    toast.error("Notifications not supported");
                    return;
                  }

                  if (e.target.checked) {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                      setIsNotificationActive(true);
                      toast.success("Mobile Alerts Active");
                      new Notification("Hafiz JI Registry", {
                        body: "Notifications are now synchronized with your mobile panel.",
                        icon: "/logo.png"
                      });
                    } else {
                      setIsNotificationActive(false);
                      toast.error("Permission was not granted");
                    }
                  } else {
                    setIsNotificationActive(false);
                    toast.error("Mute alerts via browser settings");
                  }
                }}
                style={{ width: '40px', height: '20px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="row g-3 mb-5 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-5">

        {/* REVENUE CARD */}
        <div className="col">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: "4px solid #10b981" }}>
            <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.7rem" }}>Total Sales</p>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="fw-bold mb-0 text-dark">₹{totalRevenue.toLocaleString()}</h4>
              <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                <TrendingUp size={18} className="text-success" />
              </div>
            </div>
            <small className="text-muted d-block mt-2">{sales.length} Outbound</small>
          </div>
        </div>

        {/* EXPENSES CARD */}
        <div className="col">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: "4px solid #ef4444" }}>
            <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.7rem" }}>Total Purchases</p>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="fw-bold mb-0 text-dark">₹{totalSpend.toLocaleString()}</h4>
              <div className="bg-danger bg-opacity-10 p-2 rounded-circle">
                <TrendingDown size={18} className="text-danger" />
              </div>
            </div>
            <small className="text-muted d-block mt-2">{purchases.length} Inbound</small>
          </div>
        </div>

        {/* WAREHOUSE VALUATION */}
        <div className="col">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: "4px solid #f59e0b" }}>
            <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.7rem" }}>Stock Valuation</p>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="fw-bold mb-0 text-warning-emphasis">₹{inventoryValue.toLocaleString()}</h4>
              <div className="bg-warning bg-opacity-10 p-2 rounded-circle">
                <PackageSearch size={18} className="text-warning-emphasis" />
              </div>
            </div>
            <small className="text-muted d-block mt-2">Asset in Warehouse</small>
          </div>
        </div>

        {/* CASH FLOW CARD */}
        <div className="col">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: `4px solid ${cashFlow >= 0 ? '#3b82f6' : '#ef4444'}` }}>
            <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.7rem" }}>Cash Flow (P/L)</p>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className={`fw-bold mb-0 ${cashFlow >= 0 ? 'text-primary' : 'text-danger'}`}>
                ₹{Math.abs(cashFlow).toLocaleString()}
              </h4>
              <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                <IndianRupee size={18} className="text-primary" />
              </div>
            </div>
            <small className="text-muted d-block mt-2">{cashFlow >= 0 ? 'Surplus' : 'Cash Deficit'}</small>
          </div>
        </div>

        {/* NET WORTH / EQUITY CARD */}
        <div className="col">
          <div className="card border-0 shadow-sm h-100 p-3 bg-dark text-white" style={{ borderLeft: "4px solid #8b5cf6" }}>
            <p className="text-gray-400 fw-bold mb-1 text-uppercase" style={{ fontSize: "0.7rem" }}>Business Equity</p>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="fw-bold mb-0 text-info">₹{businessEquity.toLocaleString()}</h4>
              <div className="bg-info bg-opacity-10 p-2 rounded-circle">
                <TrendingUp size={18} className="text-info" />
              </div>
            </div>
            <small className="text-gray-400 d-block mt-2">Cash + Stock Value</small>
          </div>
        </div>

        {/* PRODUCTION HUB CARD (NEW) */}
        <div className="col">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: "4px solid #6366f1" }}>
            <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.7rem" }}>Internal Production</p>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="fw-bold mb-0 text-indigo-600">{totalProductionWeight.toLocaleString()} <small className="fs-6">kg</small></h4>
              <div className="bg-indigo-50 p-2 rounded-circle text-indigo-600">
                <Zap size={18} />
              </div>
            </div>
            <small className="text-muted d-block mt-2">{production.length} Gains Logged</small>
          </div>
        </div>

      </div>

      {/* MONTHLY PERFORMANCE COMPARISON */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h5 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                  <Users size={20} className="text-secondary" /> Partner Growth Insights
                </h5>
                <small className="text-muted">Top accounts by transaction volume vs last month</small>
              </div>
              <div className="d-flex gap-2">
                <span className="badge bg-light text-muted border px-2 py-1 small">Previous: {lastMonthStr}</span>
                <span className="badge bg-indigo text-white px-2 py-1 small" style={{ backgroundColor: '#6366f1' }}>Current: {currentMonthStr}</span>
              </div>
            </div>

            {/* DESKTOP VIEW */}
            <div className="table-responsive d-none d-lg-block">
              <table className="table table-borderless align-middle mb-0">
                <thead>
                  <tr className="border-bottom text-muted small text-uppercase letter-spacing-1 fw-black">
                    <th className="ps-0 py-3" style={{ width: '40%' }}>Strategic Partner</th>
                    <th className="text-center py-3">Growth Momentum</th>
                    <th className="text-end py-3 pe-0">Executive Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((p, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="ps-0 py-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`rounded-4 d-flex align-items-center justify-content-center fw-black shadow-sm text-white ${p.statusColor === 'success' ? 'bg-success' : p.statusColor === 'danger' ? 'bg-danger' : 'bg-primary'}`} style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-black text-dark fs-6 text-uppercase tracking-tighter">{p.name}</div>
                            <div className="small text-muted d-flex align-items-center gap-2 mt-1">
                              <span className="fw-bold">Current: ₹{p.current.toLocaleString()}</span>
                              <span className="opacity-25">|</span>
                              <span className="opacity-75">Prev: ₹{p.previous.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center" style={{ minWidth: '220px' }}>
                        <div className="px-4">
                          <div className="d-flex justify-content-between mb-2 smaller fw-black text-uppercase tracking-widest opacity-50">
                            <span className={`text-${parseFloat(p.growth) >= 0 ? 'success' : 'danger'}`}>
                              {parseFloat(p.growth) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {p.growth}%
                            </span>
                            <span>Goal Track</span>
                          </div>
                          <div className="progress overflow-visible bg-light position-relative" style={{ height: '8px', borderRadius: '4px' }}>
                            <div
                              className={`progress-bar rounded-pill shadow-sm bg-${p.statusColor}`}
                              style={{ width: `${Math.min(100, (p.current / (Math.max(p.previous, p.current) || 1)) * 100)}%` }}
                            ></div>
                            {/* Marker for previous month */}
                            <div className="position-absolute top-0 h-100" style={{ left: `${(p.previous / (Math.max(p.previous, p.current) || 1)) * 100}%`, width: '2px', backgroundColor: '#000', opacity: 0.2 }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="text-end pe-0">
                        <div className="d-flex flex-column align-items-end">
                          <div className={`badge rounded-pill px-3 py-2 smaller fw-black mb-1 shadow-sm border border-2 border-white bg-${p.statusColor} text-white text-uppercase tracking-widest`}>
                            {p.status}
                          </div>
                          <div className="smaller text-muted opacity-50 fw-bold">Performance Index</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW (CARDS) */}
            <div className="d-lg-none d-flex flex-column gap-3">
              {comparisonData.map((p, idx) => (
                <div key={idx} className="p-3 border rounded-4 bg-white shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className={`rounded-circle bg-${p.statusColor} text-white d-flex align-items-center justify-content-center fw-black`} style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {p.name.charAt(0)}
                      </div>
                      <h6 className="fw-black m-0 text-dark text-uppercase smaller tracking-tight">{p.name}</h6>
                    </div>
                    <div className={`badge rounded-pill px-2 py-1 smaller bg-${p.statusColor} text-white fw-black text-uppercase`}>
                      {p.status}
                    </div>
                  </div>
                  <div className="row g-2 text-center mb-0">
                    <div className="col-4 border-end px-1">
                      <div style={{
                        backgroundColor: "#e0e7ff",
                        color: "#4338ca",
                        fontSize: "0.52rem",
                        padding: "2px 4px"
                      }} className="badge smaller fw-black text-uppercase border-0 mb-1">Current</div>
                      <div className="fw-black text-dark smaller">₹{p.current.toLocaleString()}</div>
                    </div>
                    <div className="col-4 border-end px-1">
                      <div style={{
                        backgroundColor: "#acadb0ff",
                        color: "#515050ff",
                        fontSize: "0.52rem",
                        padding: "2px 4px"
                      }} className="badge   smaller fw-black text-uppercase border mb-1">Previous</div>
                      <div className="fw-black text-muted smaller">₹{p.previous.toLocaleString()}</div>
                    </div>
                    <div className="col-4">
                      <div style={{
                        color: "#3b2626ff",
                        fontSize: "0.52rem",
                        padding: "2px 4px",
                      }} className="smaller  text-uppercase fw-bold  mb-1">Growth</div>
                      <div className={`fw-black smaller text-${parseFloat(p.growth) >= 0 ? 'success' : 'danger'}`}>
                        {parseFloat(p.growth) >= 0 ? '+' : ''}{p.growth}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
            <h5 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
              <Layers size={20} className="text-secondary" /> Volume Weightage (kg)
            </h5>
            <div className="position-relative" style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString()} kg`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="position-absolute top-50 start-50 translate-middle text-center">
                <h4 className="fw-bold m-0 text-dark">{distributionData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</h4>
                <small className="text-muted fw-bold small">Total KG</small>
              </div>
            </div>
            <div className="mt-4 px-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {distributionData.map((item, index) => {
                const percentage = ((item.value / (distributionData.reduce((sum, i) => sum + i.value, 0) || 1)) * 100).toFixed(1);
                return (
                  <div key={index} className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1 small">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="fw-bold text-dark smaller">{item.name}</span>
                      </div>
                      <span className="fw-bold text-muted smaller">{item.value.toLocaleString()} kg</span>
                    </div>
                    <div className="progress" style={{ height: '4px', backgroundColor: '#f3f4f6' }}>
                      <div className="progress-bar rounded-pill" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="row g-4 mb-4">
        {/* MAIN BAR CHART */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100 p-4 bg-white">
            <h5 className="fw-bold mb-4 text-dark">Revenue vs Buying Spend (Monthly Trend)</h5>
            <div className="chart-container" style={{ width: '100%', height: window.innerWidth < 768 ? 280 : 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: window.innerWidth < 768 ? 9 : 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: window.innerWidth < 768 ? 9 : 12, fontWeight: 600 }}
                      tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px', fontSize: window.innerWidth < 768 ? '10px' : '14px', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10b981"
                      strokeWidth={window.innerWidth < 768 ? 2 : 4}
                      dot={{ r: window.innerWidth < 768 ? 2 : 5, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      name="Spend"
                      stroke="#ef4444"
                      strokeWidth={window.innerWidth < 768 ? 2 : 4}
                      dot={{ r: window.innerWidth < 768 ? 2 : 5, fill: "#ef4444" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TOP ACCOUNTS LEDGER */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100 p-0 bg-white overflow-hidden">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="fw-bold m-0 text-dark">Top Partner Accounts</h5>
              <small className="text-muted">By total transaction value</small>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {/* Calculate values per account */}
                {Object.values([...sales, ...purchases].reduce((acc, item) => {
                  const name = item.vendorName || item.supplierName;
                  if (!acc[name]) acc[name] = { name, total: 0, type: item.vendorName ? 'SALE' : 'PURCHASE' };
                  acc[name].total += item.amount;
                  return acc;
                }, {}))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 6)
                  .map((partner, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center p-3 border-bottom-0">
                      <div className="d-flex align-items-center">
                        <h4 className="fw-bold text-muted m-0 me-3">#{index + 1}</h4>
                        <div>
                          <h6 className="m-0 fw-bold text-dark">{partner.name}</h6>
                          <small className={partner.type === 'SALE' ? 'text-success' : 'text-danger'}>
                            {partner.type === 'SALE' ? 'Primary Customer' : 'Primary Supplier'}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <h6 className={`m-0 fw-bold ${partner.type === 'SALE' ? 'text-success' : 'text-danger'}`}>
                          ₹{partner.total.toLocaleString()}
                        </h6>
                      </div>
                    </li>
                  ))}
                {Object.keys([...sales, ...purchases]).length === 0 && <li className="list-group-item text-center py-4 text-muted">No accounts active</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* RECENT ACTIVITY ROW (GROUPED BY ACCOUNT) */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm p-4 bg-white">
            <h5 className="fw-bold mb-4 text-dark">Recent Account Summaries (Bills)</h5>
            <div className="table-responsive border-0" style={{ overflowX: 'auto' }}>
              <table className="table table-hover align-middle mb-0" style={{ minWidth: window.innerWidth < 768 ? '850px' : 'auto' }}>
                <thead className="table-dark">
                  <tr className="smaller text-uppercase fw-black bg-dark">
                    <th className="py-3 ps-4" style={{ width: '180px' }}>Category</th>
                    <th className="py-3">Period</th>
                    <th className="py-3">Account Holder</th>
                    <th className="text-center py-3">Entries</th>
                    <th className="text-center py-3">Status</th>
                    <th className="text-center py-3">Total weight</th>
                    <th className="text-end pe-4 py-3">Final Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values([...sales, ...purchases].reduce((acc, item) => {
                    const key = `${item.recordMonth}-${item.vendorName || item.supplierName}`;
                    const status = (item.status || "PENDING").toUpperCase();

                    if (!acc[key]) {
                      acc[key] = {
                        name: item.vendorName || item.supplierName,
                        month: item.recordMonth,
                        amount: 0,
                        weight: 0,
                        count: 0,
                        type: item.saleDate ? 'SALE' : 'PURCHASE',
                        partnerId: item.vendorId || item.supplierId,
                        date: new Date(item.saleDate || item.purchaseDate),
                        statuses: []
                      };
                    }
                    acc[key].amount += item.amount;
                    acc[key].weight += (parseFloat(item.weight) || 0);
                    acc[key].count += 1;
                    acc[key].statuses.push(status);
                    return acc;
                  }, {})).map(bill => {
                    // Aggregate Status Logic
                    const unique = [...new Set(bill.statuses)];
                    let finalStatus = "PENDING";
                    if (unique.length === 1 && unique[0] === "PAID") finalStatus = "PAID";
                    else if (unique.includes("PAID") || unique.includes("PARTIAL")) finalStatus = "PARTIAL";

                    return { ...bill, finalStatus };
                  })
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 8)
                    .map((bill, idx) => (
                      <tr key={idx} className="cursor-pointer border-bottom border-light" onClick={() => navigate(`/bill-details/${bill.type.toLowerCase() === 'sale' ? 'sales' : 'purchase'}/${bill.partnerId}/${bill.month}`)}>
                        <td className="py-3 ps-4">
                          <div className={`badge rounded-pill px-3 py-2 fw-black text-uppercase tracking-tighter d-flex align-items-center gap-2 w-fit ${bill.type === 'SALE' ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ fontSize: '0.65rem' }}>
                            {bill.type === 'SALE' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {bill.type === 'SALE' ? 'Sales Account' : 'Suppliers Account'}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="fw-bold text-dark fs-6">{bill.month}</div>
                          <small className="text-muted smaller">Voucher Period</small>
                        </td>
                        <td className="py-3">
                          <div className="fw-bold text-dark text-capitalize">{bill.name}</div>
                          <small className="text-muted smaller">Account Holder</small>
                        </td>
                        <td className="text-center py-3">
                          <div className="badge bg-light text-dark border rounded-pill px-2 py-1 smaller fw-bold">{bill.count} Records</div>
                        </td>
                        <td className="text-center py-3">
                          <span className={`badge rounded-pill px-3 py-2 smaller shadow-sm fw-bold ${bill.finalStatus === 'PAID' ? 'bg-soft-success text-success' : bill.finalStatus === 'PARTIAL' ? 'bg-soft-warning text-warning' : 'bg-soft-danger text-danger'}`}>
                            {bill.finalStatus}
                          </span>
                        </td>
                        <td className="text-center py-3">
                          <div className="fw-bold text-dark">{bill.weight.toFixed(2)} <small className="small opacity-50">kg</small></div>
                        </td>
                        <td className={`text-end pe-4 py-3 fw-bold fs-5 ${bill.type === 'SALE' ? 'text-success' : 'text-danger'}`}>
                          ₹{bill.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
