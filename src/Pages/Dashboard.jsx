import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkshopContext } from "../Context";
import axios from "axios";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PackageSearch, TrendingUp, TrendingDown, IndianRupee, Bell, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { loca } = useContext(WorkshopContext);
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salesRes, purchRes, invRes, suppRes] = await Promise.all([
          axios.get(`${loca}/sales`),
          axios.get(`${loca}/purchases`),
          axios.get(`${loca}/inventories`),
          axios.get(`${loca}/suppliers`)
        ]);

        setSales(salesRes.data.data || []);
        setPurchases(purchRes.data.data || []);
        setInventory(invRes.data.data || []);
        setSuppliers(suppRes.data.data || []);
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
  const netProfit = totalRevenue - totalSpend;
  const currentWarehouseValue = inventory.reduce((sum, i) => sum + (i.quantity * i.rate), 0);

  // Group Sales and Purchases by Date to format chart
  const calculateFinancialChartData = () => {
    const dataMap = {};
    
    // Process purchases
    purchases.forEach(p => {
      const dateKey = new Date(p.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dataMap[dateKey]) dataMap[dateKey] = { date: dateKey, revenue: 0, spend: 0 };
      dataMap[dateKey].spend += p.amount;
    });

    // Process sales
    sales.forEach(s => {
      const dateKey = new Date(s.saleDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dataMap[dateKey]) dataMap[dateKey] = { date: dateKey, revenue: 0, spend: 0 };
      dataMap[dateKey].revenue += s.amount;
    });

    return Object.values(dataMap).slice(0, 7); // Last 7 days overview
  };

  const chartData = calculateFinancialChartData();

  const todayDay = new Date().getDate();
  const todayCollections = suppliers.filter(s => s.collectionDate === todayDay);

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
      {todayCollections.length > 0 && (
        <div className="alert border-0 border-warning border-start border-4 shadow-sm mb-4 d-flex align-items-center justify-content-between bg-white" style={{ borderRadius: '8px' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-25 p-2 rounded-circle">
              <Bell className="text-warning-emphasis" size={24} />
            </div>
            <div>
              <h6 className="fw-bold mb-1 text-dark">Stock Collection Reminder (Day {todayDay})</h6>
              <p className="mb-0 text-muted small">You have {todayCollections.length} supplier(s) scheduled for stock collection today:</p>
              <div className="mt-1 d-flex flex-wrap gap-2">
                {todayCollections.map(s => <span key={s.id} className="badge bg-light text-dark border">{s.name}</span>)}
              </div>
            </div>
          </div>
          <button className="btn btn-warning btn-sm fw-bold px-3 d-flex align-items-center gap-2 shadow-sm" onClick={() => navigate('/accounts')}>
            View Accounts <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="row g-4 mb-5">
        
        {/* REVENUE CARD */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: "5px solid #10b981" }}>
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.8rem" }}>Total Revenue</p>
                <h3 className="fw-bold mb-0 text-dark">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h3>
              </div>
              <div className="bg-success bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                <TrendingUp size={24} className="text-success" />
              </div>
            </div>
            <p className="text-muted mt-3 mb-0" style={{ fontSize: "0.8rem" }}><span className="text-success fw-bold">+{sales.length}</span> Outbound Sales</p>
          </div>
        </div>

        {/* EXPENSES CARD */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: "5px solid #ef4444" }}>
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.8rem" }}>Total Purchasing</p>
                <h3 className="fw-bold mb-0 text-dark">₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h3>
              </div>
              <div className="bg-danger bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                <TrendingDown size={24} className="text-danger" />
              </div>
            </div>
            <p className="text-muted mt-3 mb-0" style={{ fontSize: "0.8rem" }}><span className="text-danger fw-bold">+{purchases.length}</span> Inbound Loads</p>
          </div>
        </div>

        {/* PROFIT CARD */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 p-3 bg-white" style={{ borderLeft: `5px solid ${netProfit >= 0 ? '#3b82f6' : '#ef4444'}` }}>
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: "0.8rem" }}>Overall Net Profit</p>
                <h3 className={`fw-bold mb-0 ${netProfit >= 0 ? "text-primary" : "text-danger"}`}>
                  ₹{Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  {netProfit < 0 ? " (Loss)" : ""}
                </h3>
              </div>
              <div className="bg-primary bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                <IndianRupee size={24} className="text-primary" />
              </div>
            </div>
            <p className="text-muted mt-3 mb-0" style={{ fontSize: "0.8rem" }}>All time Margin calculation</p>
          </div>
        </div>

        {/* WAREHOUSE CARD */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 p-3 bg-dark text-white" style={{ borderLeft: "5px solid #f59e0b" }}>
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-gray-400 fw-bold mb-1 text-uppercase" style={{ fontSize: "0.8rem" }}>Current Warehouse Value</p>
                <h3 className="fw-bold mb-0 text-warning">₹{currentWarehouseValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h3>
              </div>
              <div className="bg-warning bg-opacity-25 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px" }}>
                <PackageSearch size={24} className="text-warning" />
              </div>
            </div>
            <p className="text-gray-400 mt-3 mb-0" style={{ fontSize: "0.8rem" }}><span className="text-warning fw-bold">{inventory.length}</span> Material Categories Stocked</p>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="row g-4 mb-4">
        {/* MAIN BAR CHART */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100 p-4 bg-white">
            <h5 className="fw-bold mb-4 text-dark">Revenue vs Buying Spend</h5>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="revenue" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spend" name="Purchase Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
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
                    .sort((a,b) => b.total - a.total)
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
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr className="text-muted small">
                    <th>Billing Type</th>
                    <th>Account Holder</th>
                    <th>Entry Month</th>
                    <th className="text-center">Items</th>
                    <th className="text-end">Total Bill Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values([...sales, ...purchases].reduce((acc, item) => {
                    const key = `${item.recordMonth}-${item.vendorName || item.supplierName}`;
                    if (!acc[key]) {
                      acc[key] = { 
                        name: item.vendorName || item.supplierName, 
                        month: item.recordMonth, 
                        amount: 0, 
                        count: 0,                         type: item.saleDate ? 'SALE' : 'PURCHASE',
                        partnerId: item.vendorId || item.supplierId,
                        date: new Date(item.saleDate || item.purchaseDate)
                      };
                    }
                    acc[key].amount += item.amount;
                    acc[key].count += 1;
                    return acc;
                  }, {}))
                    .sort((a, b) => b.date - a.date)
                     .slice(0, 5)
                    .map((bill, idx) => (
                      <tr key={idx} className="cursor-pointer" onClick={() => navigate(`/bill-details/${bill.type.toLowerCase() === 'sale' ? 'sales' : 'purchase'}/${bill.partnerId}/${bill.month}`)}>
                        <td>
                          <span className={`badge ${bill.type === 'SALE' ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${bill.type === 'SALE' ? 'success' : 'danger'} px-2 py-1`}>
                            {bill.type === 'SALE' ? 'Invoiced' : 'Purchased'}
                          </span>
                        </td>
                        <td className="fw-bold small">{bill.name}</td>
                        <td className="text-muted small">{bill.month}</td>
                        <td className="text-center small">{bill.count} Categories</td>
                        <td className={`text-end fw-bold ${bill.type === 'SALE' ? 'text-success' : 'text-danger'}`}>
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
