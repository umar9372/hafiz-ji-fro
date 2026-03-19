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
      const element = printRef.current;
      // Temporarily hide elements with d-print-none during capture or handle it in html2canvas options
      // html2canvas doesn't automatically respect d-print-none, so we define a custom scale and options
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.classList.contains('d-print-none')
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.classList.contains('d-print-none')
      });
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
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleDownloadPDF}>
            <Download size={16} /> <span className="d-none d-sm-inline">PDF</span>
          </button>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={handleDownloadImage}>
            <ImageIcon size={16} /> <span className="d-none d-sm-inline">Image</span>
          </button>
        </div>
      </div>

      {/* BILL DOCUMENT */}
      <div className="card shadow-lg border-0 mb-5 overflow-hidden" ref={printRef}>
        {/* Banner */}
        <div className={`py-2 ${type === "purchase" ? "bg-danger" : "bg-success"}`}></div>

        <div className="card-body p-5">
          {/* Logo & Bill Header */}
          <div className="row mb-5 pb-4 border-bottom">
            <div className="col-sm-6">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className={`p-2 rounded bg-dark text-white`}>
                  <Receipt size={32} />
                </div>
                <h2 className="fw-bold m-0 text-dark">HAFIZ JI</h2>
              </div>
              <p className="text-muted small">
                <strong>Address:</strong> Jabbar compound, near usman gani masjid bhiwandi. <br />
                <strong>Contact:</strong> +91 9850841012
              </p>
            </div>
            <div className="col-sm-6 text-sm-end">
              <h1 className="fw-bold text-muted opacity-50 text-uppercase mb-0"> {type === "purchase" ? "Purchase Bill" : "Sales Invoice"}</h1>
              <div className="mt-2">
                <div className="fw-bold text-dark">Ref No: #{type.toUpperCase().substring(0, 2)}-{month.replace('-', '')}-{id}</div>
                <div className="text-muted small">Date: {new Date().toLocaleDateString()}</div>
                <div className="dropdown mt-2 d-print-none">
                  <button className={`btn btn-sm dropdown-toggle fw-bold ${records[0]?.status === 'PAID' ? 'btn-success' : records[0]?.status === 'PARTIAL' ? 'btn-warning' : 'btn-outline-danger'}`} type="button" data-bs-toggle="dropdown">
                    Status: {records[0]?.status || "PENDING"}
                  </button>
                  <ul className="dropdown-menu shadow">
                    <li><button className="dropdown-item fw-bold text-danger" onClick={() => updateStatus('PENDING')}>PENDING</button></li>
                    <li><button className="dropdown-item fw-bold text-warning" onClick={() => updateStatus('PARTIAL')}>PARTIAL</button></li>
                    <li><button className="dropdown-item fw-bold text-success" onClick={() => updateStatus('PAID')}>PAID</button></li>
                  </ul>
                </div>
                <div className="badge bg-light text-dark border mt-1 d-none d-print-block">Status: {records[0]?.status || "PENDING"}</div>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="row mb-5">
            <div className="col-6">
              <p className="text-muted small text-uppercase fw-bold mb-2">Account Details</p>
              <div className="d-flex align-items-start gap-2">
                <User size={16} className="text-primary mt-1" />
                <div>
                  <h5 className="fw-bold mb-1 text-dark">{partner?.name}</h5>
                  <p className="text-muted small mb-0">
                    {partner?.address || "Address not provided"}<br />
                    <strong>Contact:</strong> {partner?.mobile || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-6 text-end">
              <p className="text-muted small text-uppercase fw-bold mb-2">Billing Cycle</p>
              <div className="d-flex align-items-center justify-content-end gap-2 h5 fw-bold text-dark">
                <Calendar size={20} className="text-primary" />
                {formatMonthName(month)}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="bg-light">
                <tr className="small text-uppercase fw-bold">
                  <th className="ps-3" style={{ width: '50px' }}>#</th>
                  <th>Material & Description</th>
                  <th className="text-center">Entry Date</th>
                  <th className="text-center">Weight (kg)</th>
                  <th className="text-center">Rate (₹)</th>
                  <th className="text-end pe-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <div className="fw-bold text-dark text-capitalize">{r.materialName}</div>
                      <small className="text-muted">Batch ID: #REC-{r.id}</small>
                    </td>
                    <td className="text-center small text-muted">
                      {new Date(r.purchaseDate || r.saleDate).toLocaleDateString()}
                    </td>
                    <td className="text-center fw-bold">{r.weight.toFixed(2)}</td>
                    <td className="text-center">₹{r.rate.toLocaleString()}</td>
                    <td className="text-end pe-3 fw-bold">₹{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-top-0">
                <tr>
                  <td colSpan="3" className="border-0"></td>
                  {/* <td className="text-center bg-light fw-bold border-top">{totalWeight.toFixed(2)} kg</td> */}
                  <td className="text-end fw-bold border-0 pt-3">Grand Total:</td>
                  <td className={`text-end pe-3 border-top pt-3 h4 fw-bold ${type === "purchase" ? "text-danger" : "text-success"}`}>
                    ₹{totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature Area */}
          <div className="row mt-5 pt-5">
            <div className="col-4">
              <div className="border-top text-center pt-2 small text-muted">Authorized Signatory</div>
            </div>
            <div className="col-4 offset-4">
              <div className="border-top text-center pt-2 small text-muted">Receiver's Seal</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-5 pt-4 text-muted small border-top">
            This is a computer-generated document. No physical signature is required for digital verification.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
            body { background: white !important; }
            .container { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .card { box-shadow: none !important; border: none !important; }
            .card-body { padding: 40px !important; }
        }
      `}</style>
    </div>
  );
}
