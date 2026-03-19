import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { WorkshopContext } from "../Context";
import { History as HistoryIcon, ArrowDownCircle, ArrowUpCircle, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function History() {
  const { loca } = useContext(WorkshopContext);
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [combined, setCombined] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState("ALL"); // ALL, PURCHASE, SALE
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        axios.get(`${loca}/purchases`),
        axios.get(`${loca}/sales`)
      ]);

      const pData = pRes.data.data.map(p => ({ ...p, type: "PURCHASE" }));
      const sData = sRes.data.data.map(s => ({ ...s, type: "SALE" }));

      setPurchases(pData);
      setSales(sData);
      
      const all = [...pData, ...sData].sort((a, b) => {
          const dateA = a.purchaseDate || a.saleDate;
          const dateB = b.purchaseDate || b.saleDate;
          return new Date(dateB) - new Date(dateA);
      });
      setCombined(all);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filteredHistory = combined.filter(item => {
    const matchesType = filterType === "ALL" || item.type === filterType;
    const accountName = (item.supplierName || item.vendorName || "").toLowerCase();
    const materialName = (item.materialName || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = accountName.includes(search) || materialName.includes(search);
    const matchesMonth = !monthFilter || item.recordMonth === monthFilter;

    return matchesType && matchesSearch && matchesMonth;
  });

  const groupedBillHistory = Object.values(filteredHistory.reduce((acc, item) => {
    const partnerId = item.supplierId || item.vendorId;
    const key = `${item.type}-${item.recordMonth}-${partnerId}`;
    if (!acc[key]) {
      acc[key] = {
        type: item.type,
        recordMonth: item.recordMonth,
        partnerName: item.supplierName || item.vendorName,
        partnerId: partnerId,
        totalWeight: 0,
        totalAmount: 0,
        latestDate: item.purchaseDate || item.saleDate,
        itemsCount: 0
      };
    }
    acc[key].totalWeight += item.weight;
    acc[key].totalAmount += item.amount;
    acc[key].itemsCount += 1;
    const itemDate = new Date(item.purchaseDate || item.saleDate);
    if (itemDate > new Date(acc[key].latestDate)) acc[key].latestDate = item.purchaseDate || item.saleDate;
    
    return acc;
  }, {})).sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));

  const handleRowClick = (bill) => {
     navigate(`/bill-details/${bill.type.toLowerCase()}/${bill.partnerId}/${bill.recordMonth}`);
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="bg-dark p-2 rounded-3 text-white shadow-sm">
          <HistoryIcon size={28} />
        </div>
        <h2 className="fw-bold m-0 text-dark">Business Billing Logs</h2>
      </div>

      {/* FILTER BAR */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted text-uppercase">Log Type</label>
              <select 
                className="form-select border-secondary-subtle" 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Multi-Bills</option>
                <option value="PURCHASE">Purchase (Intake)</option>
                <option value="SALE">Sales (Outbound)</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted text-uppercase">Billing Month</label>
              <input 
                type="month" 
                className="form-control border-secondary-subtle" 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-muted text-uppercase">Search Customer / Supplier</label>
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Type name here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="card shadow border-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="ps-4">Category</th>
                <th>Billing Period</th>
                <th>Account Holder</th>
                <th className="text-center">Voucher Entries</th>
                <th className="text-center">Total Weight</th>
                <th className="text-end pe-4">Final Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5">
                   <div className="spinner-border text-primary" role="status"></div>
                </td></tr>
              ) : groupedBillHistory.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5 text-muted fst-italic">No records match your filters.</td></tr>
              ) : (
                groupedBillHistory.map((bill, idx) => (
                  <tr key={idx} className="cursor-pointer" onClick={() => handleRowClick(bill)} title="Click to view detailed vouchers">
                    <td className="ps-4">
                      {bill.type === "PURCHASE" ? (
                        <span className="badge bg-danger text-white px-3 py-2 d-flex align-items-center gap-2 w-fit">
                          <ArrowDownCircle size={14} /> Suppliers Account
                        </span>
                      ) : (
                        <span className="badge bg-success text-white px-3 py-2 d-flex align-items-center gap-2 w-fit">
                          <ArrowUpCircle size={14} /> Sales Account
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{formatMonthName(bill.recordMonth)}</span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark fs-6">{bill.partnerName}</div>
                      <small className="text-muted">Last entry: {new Date(bill.latestDate).toLocaleDateString()}</small>
                    </td>
                    <td className="text-center">
                      <span className="badge rounded-pill bg-light text-dark border px-3">{bill.itemsCount} Records</span>
                    </td>
                    <td className="text-center fw-bold">{bill.totalWeight.toFixed(2)} kg</td>
                    <td className="text-end pe-4">
                      <div className={`fw-bold fs-5 ${bill.type === "PURCHASE" ? "text-danger" : "text-success"}`}>
                        ₹{bill.totalAmount.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredHistory.length > 0 && (
          <div className="mt-4 row g-3">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm bg-danger bg-opacity-75 text-white">
                    <div className="card-body py-3">
                        <small className="text-uppercase fw-bold opacity-75">Total Intake (Expense)</small>
                        <h3 className="fw-bold mb-0">₹{filteredHistory.filter(i => i.type === "PURCHASE").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h3>
                    </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm bg-success bg-opacity-75 text-white">
                    <div className="card-body py-3">
                        <small className="text-uppercase fw-bold opacity-75">Total Sales (Revenue)</small>
                        <h3 className="fw-bold mb-0">₹{filteredHistory.filter(i => i.type === "SALE").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h3>
                    </div>
                </div>
              </div>
          </div>
      )}
    </div>
  );
}
