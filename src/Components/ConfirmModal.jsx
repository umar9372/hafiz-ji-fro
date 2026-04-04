import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning' }) => {
  if (!isOpen) return null;

  const colors = {
    warning: {
      bg: 'bg-warning',
      text: 'text-warning',
      btn: 'btn-warning',
      icon: <AlertCircle className="text-warning" size={48} />
    },
    danger: {
      bg: 'bg-danger',
      text: 'text-danger',
      btn: 'btn-danger',
      icon: <AlertCircle className="text-danger" size={48} />
    },
    success: {
      bg: 'bg-success',
      text: 'text-success',
      btn: 'btn-success',
      icon: <CheckCircle className="text-success" size={48} />
    }
  };

  const theme = colors[type] || colors.warning;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="modal-dialog modal-dialog-centered px-3">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          <div className="modal-body p-4 p-md-5 text-center bg-white">
            <div className="mb-4 d-inline-flex p-3 rounded-circle bg-light">
              {theme.icon}
            </div>
            <h4 className="fw-black text-slate-900 mb-2 ls-tight">{title || 'Confirm Action'}</h4>
            <p className="text-slate-500 mb-4 px-md-4 small fw-medium">{message || 'Please confirm if you wish to proceed with this operation.'}</p>
            
            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
              <button 
                type="button" 
                className="btn btn-light px-4 py-2 fw-bold text-muted border-0 bg-slate-100 rounded-3 text-uppercase smaller tracking-wide" 
                onClick={onClose}
              >
                Go Back
              </button>
              <button 
                type="button" 
                className={`btn ${theme.btn} px-5 py-2 fw-black text-white shadow-sm rounded-3 text-uppercase smaller tracking-wide`} 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Execution
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .text-slate-900 { color: #0f172a; }
        .text-slate-500 { color: #64748b; }
        .bg-slate-100 { background-color: #f1f5f9; }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
