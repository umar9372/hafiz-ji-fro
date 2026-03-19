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
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className={`py-2 ${theme.bg}`}></div>
          <div className="modal-body p-4 text-center">
            <div className="mb-3">
              {theme.icon}
            </div>
            <h4 className="fw-bold text-dark mb-2">{title || 'Are you sure?'}</h4>
            <p className="text-muted mb-4">{message || 'This action cannot be undone.'}</p>
            
            <div className="d-flex gap-3 justify-content-center">
              <button 
                type="button" 
                className="btn btn-light px-4 py-2 fw-bold text-muted border" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={`btn ${theme.btn} px-4 py-2 fw-bold text-white shadow-sm`} 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
