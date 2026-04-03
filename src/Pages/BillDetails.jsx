import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { WorkshopContext } from "../Context";
import toast from "react-hot-toast";
import { Printer, ArrowLeft, Download, FileText, User, Calendar, Receipt, ImageIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function BillDetails() {
  const { type, id, month } = useParams();
  const { loca, user } = useContext(WorkshopContext);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [partner, setPartner] = useState(null);
  const [showRates, setShowRates] = useState(true);

  const printRef = useRef();

  useEffect(() => {
    fetchBillData();
  }, [type, id, month]);

  const fetchBillData = async () => {
    setLoading(true);
    try {
      const endpoint = type.startsWith("p") ? "/purchases" : "/sales";
      const res = await axios.get(`${loca}${endpoint}`);
      const allData = res.data.data;

      // Filter for this specific bill
      const filtered = allData.filter(item => {
        const itemId = item.supplierId || item.vendorId;
        return itemId.toString() === id.toString() && item.recordMonth === month;
      });

      setRecords(filtered);

      // Fetch partner info
      const isPurchase = type.startsWith("p");
      const partnerEndpoint = isPurchase ? `/suppliers/${id}` : `/vendors/${id}`;
      const pRes = await axios.get(`${loca}${partnerEndpoint}`);
      setPartner(pRes.data.data);

    } catch (err) {
      console.error("Error fetching bill details", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const isPurchase = type.startsWith("p");
      const paramName = isPurchase ? "supplierId" : "vendorId";
      const userName = user?.username || "system";
      await axios.put(`${loca}/${isPurchase ? 'purchases' : 'sales'}/status?${paramName}=${id}&recordMonth=${month}&status=${newStatus}&userName=${userName}`);
      toast.success("Status updated to " + newStatus);
      fetchBillData(); // Refresh
    } catch (err) {
      console.error("Error updating status", err);
      toast.error("Failed to update status");
    }
  };



  const handleDownloadPDF = async () => {
    const toastId = toast.loading("Preparing PDF...");
    try {
      window.scrollTo(0, 0);
      const element = printRef.current;
      
      // Force element to be full size and visible
      const originalStyle = element.style.overflow;
      element.style.overflow = 'visible';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200, // Force a desktop-width layout for the capture
        onclone: (clonedDoc) => {
          // Ensure all responsive tables are visible in the clone
          const tables = clonedDoc.querySelectorAll('.table-responsive');
          tables.forEach(t => t.style.overflow = 'visible');
        },
        ignoreElements: (el) => el.classList.contains('d-print-none')
      });
      
      element.style.overflow = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content is longer than A4
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice_${month}_${partner?.name?.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF Downloaded!", { id: toastId });
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const handleDownloadImage = async () => {
    const toastId = toast.loading("Preparing Image...");
    try {
      window.scrollTo(0, 0);
      const element = printRef.current;
      
      const originalStyle = element.style.overflow;
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const tables = clonedDoc.querySelectorAll('.table-responsive');
          tables.forEach(t => t.style.overflow = 'visible');
        },
        ignoreElements: (el) => el.classList.contains('d-print-none')
      });

      element.style.overflow = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Invoice_${month}_${partner?.name?.replace(/\s+/g, '_')}.png`;
      link.click();
      toast.success("Image Saved!", { id: toastId });
    } catch (err) {
      console.error("Image generation failed", err);
      toast.error("Failed to save image", { id: toastId });
    }
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return "";
    const [year, monthNum] = monthStr.split("-");
    const date = new Date(year, parseInt(monthNum) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const totalWeight = records.reduce((acc, r) => acc + r.weight, 0);
  const totalAmount = records.reduce((acc, r) => acc + r.amount, 0);

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-3 text-muted">Generating Statement...</p>
    </div>
  );

  return (
    <div className="container py-4">
      {/* HEADER ACTIONS */}
      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <Link to={`/${type}`} className="btn btn-outline-secondary d-flex align-items-center gap-2">
          <ArrowLeft size={18} /> Back to {type === "purchase" ? "Intake" : "Sales"}
        </Link>
        <div className="d-flex gap-2 flex-wrap justify-content-end align-items-center">
          <div className="form-check form-switch me-3 d-flex align-items-center gap-2">
            <input 
              className="form-check-input cursor-pointer" 
              type="checkbox" 
              id="showRatesToggle" 
              checked={showRates} 
              onChange={() => setShowRates(!showRates)} 
              style={{ width: '40px', height: '20px' }}
            />
            <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="showRatesToggle">
               Show Rates on Bill
            </label>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={handleDownloadPDF}>
            <Download size={16} /> <span className="d-none d-sm-inline">PDF</span>
          </button>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm" onClick={handleDownloadImage}>
            <ImageIcon size={16} /> <span className="d-none d-sm-inline">Image</span>
          </button>
        </div>
      </div>

      {/* BILL DOCUMENT */}
      <div className="card shadow-sm border border-light mb-5 bg-white overflow-hidden" ref={printRef} style={{ borderRadius: '0' }}>
        
        <div className="card-body p-5">
          {/* Executive Letterhead Header */}
          <div className="row mb-5 pb-4 border-bottom border-2">
            <div className="col-8">
              <div className="d-flex align-items-center gap-2 mb-3">
                 <h1 className="fw-black m-0 tracking-tighter text-slate-900" style={{ fontSize: '2.5rem', letterSpacing: '-2px' }}>HAFIZ JI</h1>
              </div>
              <div className="text-slate-600 small lh-sm">
                <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                   <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0f172a' }}></div>
                   EcoScrap Management & Logistics
                </div>
                <div>Jabbar compound, near usman gani masjid bhiwandi.</div>
                <div>Maharashtra, India - 421302</div>
                <div className="mt-2 text-dark"><strong>GSTIN:</strong> 27AABCH1234F1Z1 (PROVISIONAL)</div>
                <div><strong>Contact:</strong> +91 9850841012 | <strong>Email:</strong> hafizji.scrap@gmail.com</div>
              </div>
            </div>
            
            <div className="col-4 text-end d-flex flex-column justify-content-between">
              <div>
                <h4 className="text-uppercase fw-black text-slate-400 mb-0 ls-wide">
                  {type === "purchase" ? "Purchase Statement" : "Tax Invoice"}
                </h4>
                <div className="fw-bold text-dark fs-5 mt-1">
                   #ST-{month.replace('-', '')}-{id.toString().padStart(3, '0')}
                </div>
              </div>
              
              <div className="mt-4">
                 <div className="small text-muted text-uppercase fw-bold ls-tight">Issued Date</div>
                 <div className="fw-bold text-dark">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>

          {/* Account & Cycle Info Block (Modern Grid) */}
          <div className="row mb-5 g-0 border rounded-3 overflow-hidden bg-light bg-opacity-50">
            <div className="col-7 p-4 border-end">
              <p className="text-muted smaller text-uppercase fw-black mb-3 ls-wide">Billed To / Provider</p>
              <div className="ps-1">
                <h5 className="fw-bold mb-1 text-dark text-uppercase">{partner?.name}</h5>
                <div className="text-slate-600 small lh-sm">
                   {partner?.address || "Street address not specified"} <br/>
                   {partner?.mobile ? <span><strong>M:</strong> +91 {partner.mobile}</span> : "N/A"}
                </div>
              </div>
            </div>
            <div className="col-5 p-4 bg-white">
              <div className="mb-3 d-print-none">
                 <p className="text-muted smaller text-uppercase fw-black mb-1 ls-wide">Payment Status</p>
                 <div className="dropdown">
                   <button className={`btn btn-sm px-3 py-1 fw-black rounded-pill border-0 ${records[0]?.status === 'PAID' ? 'bg-success text-white' : records[0]?.status === 'PARTIAL' ? 'bg-warning text-dark' : 'bg-danger text-white'}`} type="button" data-bs-toggle="dropdown">
                     {records[0]?.status || "UNPAID"}
                   </button>
                   <ul className="dropdown-menu shadow border-0">
                     <li><button className="dropdown-item small fw-bold" onClick={() => updateStatus('PENDING')}>SET UNPAID</button></li>
                     <li><button className="dropdown-item small fw-bold" onClick={() => updateStatus('PARTIAL')}>SET PARTIAL</button></li>
                     <li><button className="dropdown-item small fw-bold" onClick={() => updateStatus('PAID')}>SET PAID</button></li>
                   </ul>
                 </div>
              </div>
              <div className={records[0]?.status ? "mt-0" : "mt-0"}>
                 <p className="text-muted smaller text-uppercase fw-black mb-1 ls-wide">Reporting Period</p>
                 <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                    {formatMonthName(month)}
                 </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
              <thead>
                <tr className="bg-light text-muted small text-uppercase fw-bold border-top border-bottom">
                  <th className="ps-4 py-3" style={{ width: '60px' }}>#</th>
                  <th className="py-3">Material & Item Details</th>
                  <th className="text-center py-3">Transaction Date</th>
                  <th className="text-center py-3">Weight (kg)</th>
                  {showRates && <th className="text-center py-3">Unit Rate (₹)</th>}
                  {showRates && <th className="text-end pe-4 py-3">Subtotal</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((r, index) => (
                  <tr key={index} className="border-bottom">
                    <td className="ps-4 py-3 text-muted small">{index + 1}</td>
                    <td className="py-3">
                      <div className="fw-bold text-dark text-capitalize lh-1 mb-1">{r.materialName}</div>
                      <div className="d-flex align-items-center gap-2">
                        {r.materialNameHindi && <span className="text-secondary small fw-medium">{r.materialNameHindi}</span>}
                        <span className="badge bg-light text-muted border-0 fw-normal small px-0" style={{ fontSize: '0.65rem' }}>ID: #REC-{r.id}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 small text-muted">
                      {new Date(r.purchaseDate || r.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className={`text-center py-3 fw-bold ${!showRates ? 'fs-5 text-primary' : 'text-dark'}`}>
                       {r.weight.toFixed(2)} {!showRates && <span className="small opacity-50">kg</span>}
                    </td>
                    {showRates && <td className="text-center py-3">₹{r.rate.toLocaleString('en-IN')}</td>}
                    {showRates && <td className="text-end pe-4 py-3 fw-bold text-dark">₹{r.amount.toLocaleString('en-IN')}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY / TOTAL SECTION WITH SIGNATURE */}
          <div className="row mt-4 pt-4 border-top">
             {/* Signature Block (Left side of totals) */}
             <div className="col-7 text-start">
                <div className="d-flex flex-column align-items-start justify-content-end h-100 ps-4">
                   <div className="signature-container mb-1" style={{ height: '70px', width: '180px' }}>
                      <img 
                        src="/signature.png" 
                        alt="Authorized Signatory" 
                        className="img-fluid" 
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                   </div>
                   <div className="border-top border-dark pt-1" style={{ width: '180px' }}>
                      <p className="text-uppercase fw-black text-dark mb-0 ls-tight smaller">Authorized Signatory</p>
                      <div className="text-muted" style={{ fontSize: '0.55rem' }}>E-Verified Statement</div>
                   </div>
                </div>
             </div>

             {/* Totals Block */}
             <div className="col-5">
                <div className="d-flex justify-content-between align-items-center px-2 mb-2">
                   <span className="text-muted small fw-bold text-uppercase">Total Volume</span>
                   <span className="fw-bold text-dark">{totalWeight.toFixed(2)} kg</span>
                </div>
                {showRates ? (
                  <div className="d-flex justify-content-between align-items-center px-2 py-3 border-top border-2 border-dark mt-2 bg-light rounded-3 shadow-sm">
                     <span className="h5 fw-bold mb-0 text-uppercase">Grand Total</span>
                     <span className={`h4 fw-bold mb-0 ${type === "purchase" ? "text-danger" : "text-success"}`}>
                        ₹{totalAmount.toLocaleString('en-IN')}
                     </span>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center px-2 py-3 border-top border-2 border-dark mt-2 bg-light rounded-3">
                     <span className="h5 fw-bold mb-0 text-uppercase">Total Weight</span>
                     <span className="h4 fw-bold mb-0 text-dark">
                        {totalWeight.toFixed(2)} kg
                     </span>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
            body { background: white !important; }
            .container { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .card { box-shadow: none !important; border: none !important; }
            .card-body { padding: 40px !important; }
            .table-responsive { overflow: visible !important; }
        }
        .table-responsive { overflow: visible !important; }
      `}</style>
    </div>
  );
}
