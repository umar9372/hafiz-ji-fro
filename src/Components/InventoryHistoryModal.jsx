import React from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, User, Package } from 'lucide-react';

const InventoryHistoryModal = ({ isOpen, onClose, history, materialName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-lg modal-fullscreen-sm-down modal-dialog-centered shadow-lg">
        <div className="modal-content border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white border-0 py-3">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <Package size={20} className="text-success" />
              Stock Movement: <span className="text-capitalize text-success">{materialName}</span>
            </h5>
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
                          <td className="text-end pe-4 fw-bold">₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE VIEW */}
                <div className="mobile-only p-2 bg-light">
                  {history.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-3 shadow-sm border mb-2 d-flex justify-content-between align-items-center">
                       <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                             <div className={`rounded-circle p-1 ${item.type === 'PURCHASE' ? 'bg-success' : 'bg-danger'} bg-opacity-10`}>
                                {item.type === 'PURCHASE' ? <ArrowDownLeft size={14} className="text-success" /> : <ArrowUpRight size={14} className="text-danger" />}
                             </div>
                             <small className="fw-bold text-muted">{new Date(item.date).toLocaleDateString()}</small>
                          </div>
                          <div className="fw-bold text-dark">{item.partyName}</div>
                       </div>
                       <div className="text-end">
                          <div className={`fw-bold h6 m-0 ${item.type === 'PURCHASE' ? 'text-success' : 'text-danger'}`}>
                             {item.type === 'PURCHASE' ? '+' : '-'}{item.weight.toFixed(2)} kg
                          </div>
                          <small className="text-muted fw-bold">₹{item.amount.toLocaleString()}</small>
                       </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer bg-light border-0 py-3">
            <div className="me-auto">
              <span className="badge bg-dark rounded-pill px-3 py-2 fw-bold shadow-sm">
                Total Logs: {history.length}
              </span>
            </div>
            <button type="button" className="btn btn-secondary px-4 fw-bold rounded-pill shadow-sm" onClick={onClose}>Close Registry</button>
          </div>
        </div>
      </div>
      <style>{`
        .w-fit { width: fit-content; }
      `}</style>
    </div>
  );
};

export default InventoryHistoryModal;
