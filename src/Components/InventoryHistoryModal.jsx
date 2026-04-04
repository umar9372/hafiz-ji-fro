import React from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, User, Package } from 'lucide-react';

const InventoryHistoryModal = ({ isOpen, onClose, history, materialName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-lg modal-fullscreen-sm-down modal-dialog-centered shadow-lg">
        <div className="modal-content border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white border-0 py-3">
            <h6 className="modal-title fw-black d-flex align-items-center gap-2 text-uppercase tracking-wide">
              <Package size={18} className="text-success" />
              <span className="d-none d-sm-inline">Stock Movement:</span>
              <span className="text-success">{materialName}</span>
            </h6>
            <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose}></button>
          </div>
          <div className="modal-body p-0" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <div className="text-center py-5">
                <div className="text-muted opacity-25 mb-3">
                  <Calendar size={64} />
                </div>
                <h5 className="text-muted fw-bold">No transaction history found</h5>
                <p className="text-muted small">This material has no recorded purchases or sales.</p>
              </div>
            ) : (
              <>
                {/* DESKTOP VIEW */}
                <div className="table-responsive desktop-only">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                      <tr className="small text-uppercase text-muted fw-bold">
                        <th className="ps-4">Type</th>
                        <th>Date</th>
                        <th>Account</th>
                        <th className="text-center">Weight</th>
                        <th className="text-center">Rate</th>
                        <th className="text-end pe-4">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, idx) => (
                        <tr key={idx} className={item.type === 'PURCHASE' ? 'table-success bg-opacity-10' : 'table-danger bg-opacity-10'}>
                          <td className="ps-4">
                            {item.type === 'PURCHASE' ? (
                              <span className="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 d-flex align-items-center gap-1 w-fit">
                                <ArrowDownLeft size={14} /> Intake
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1 d-flex align-items-center gap-1 w-fit">
                                <ArrowUpRight size={14} /> Sales
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="fw-bold text-dark small">{new Date(item.date).toLocaleDateString()}</div>
                          </td>
                          <td>
                            <div className="fw-bold text-dark small">{item.partyName}</div>
                          </td>
                          <td className="text-center">
                            <span className={`fw-bold ${item.type === 'PURCHASE' ? 'text-success' : 'text-danger'}`}>
                              {item.type === 'PURCHASE' ? '+' : '-'}{item.weight.toFixed(2)} <small>kg</small>
                            </span>
                          </td>
                          <td className="text-center small text-muted">₹{item.rate}</td>
                          <td className="text-end pe-4 fw-bold">₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE VIEW - High Density Cards */}
                <div className="mobile-only d-md-none bg-light p-3" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="text-muted smaller fw-black text-uppercase tracking-widest mb-3 border-bottom pb-2 opacity-75">Transaction Ledger</div>
                  {history.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-4 shadow-sm border border-light mb-3 position-relative overflow-hidden">
                      {/* Directional Indicator Bar */}
                      <div className={`position-absolute top-0 start-0 h-100 ${item.type === 'PURCHASE' ? 'bg-success' : 'bg-danger'}`} style={{ width: '4px' }}></div>

                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className={`p-2 rounded-3 ${item.type === 'PURCHASE' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                            {item.type === 'PURCHASE' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <small className="text-muted fw-bold smaller d-block lh-1 text-uppercase tracking-wider">{item.type === 'PURCHASE' ? 'Purchased From' : 'Sold To'}</small>
                            <div className="fw-black text-slate-800 fs-6">{item.partyName}</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="badge bg-light text-muted border px-2 py-1 smaller fw-bold">{new Date(item.date).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="row g-2 pt-2 border-top">
                        <div className="col-4 border-end">
                          <small className="text-muted smaller fw-bold d-block text-uppercase">Weight</small>
                          <div className={`fw-black ${item.type === 'PURCHASE' ? 'text-success' : 'text-danger'}`}>
                            {item.type === 'PURCHASE' ? '+' : '-'}{item.weight.toFixed(2)} kg
                          </div>
                        </div>
                        <div className="col-4 border-end ps-3">
                          <small className="text-muted smaller fw-bold d-block text-uppercase">Price</small>
                          <div className="fw-bold text-dark">₹{item.rate}</div>
                        </div>
                        <div className="col-4 ps-3">
                          <small className="text-info smaller fw-bold d-block text-uppercase">Total</small>
                          <div className="fw-black text-dark">₹{item.amount.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer bg-white border-top py-3 d-flex justify-content-between">
            <span className="text-muted small fw-bold">Records: {history.length}</span>
            <button type="button" className="btn btn-dark px-4 fw-black rounded-pill smaller tracking-wide text-uppercase" onClick={onClose}>Close Audit</button>
          </div>
        </div>
      </div>
      <style>{`
        .w-fit { width: fit-content; }
        .text-slate-800 { color: #1e293b; }
      `}</style>
    </div>
  );
};

export default InventoryHistoryModal;
