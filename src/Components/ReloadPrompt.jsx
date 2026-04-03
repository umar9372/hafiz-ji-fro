import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Zap } from 'lucide-react';

function ReloadPrompt() {
  const registerSW = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!registerSW) return null;

  const offlineReadyArr = registerSW.offlineReady || [false, () => {}];
  const needUpdateArr = registerSW.needUpdate || [false, () => {}];
  const updateServiceWorker = registerSW.updateServiceWorker || (() => {});

  const [offlineReady, setOfflineReady] = offlineReadyArr;
  const [needUpdate, setNeedUpdate] = needUpdateArr;

  const close = () => {
    setOfflineReady(false);
    setNeedUpdate(false);
  };

  if (!offlineReady && !needUpdate) return null;

  return (
    <div className="pwa-toast position-fixed bottom-0 start-50 translate-middle-x mb-5 shadow-lg border-0 z-3 animate-slide-up" style={{ minWidth: '320px', zIndex: 1100 }}>
      <div className="card border-0 bg-dark text-white rounded-4 overflow-hidden shadow-2xl">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3">
            <div className={`p-2 rounded-circle ${needUpdate ? 'bg-primary' : 'bg-success'} bg-opacity-25`}>
              {needUpdate ? <Zap size={20} className="text-primary" /> : <RefreshCw size={20} className="text-success" />}
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0 fw-bold">
                {needUpdate ? 'New Update Available!' : 'App Ready Offline'}
              </h6>
              <p className="smaller text-muted mb-0 opacity-75">
                {needUpdate ? 'A fresh version of Hafiz JI is ready.' : 'You can now use this app without internet.'}
              </p>
            </div>
            <button className="btn btn-sm btn-dark border-0 rounded-circle p-1 opacity-50 hover-opacity-100" onClick={close}>
              <X size={18} />
            </button>
          </div>
          
          {needUpdate && (
            <div className="mt-3">
              <button className="btn btn-primary btn-sm w-100 fw-bold py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={() => updateServiceWorker(true)}>
                <RefreshCw size={14} /> Update to Newest Version
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, -20%); opacity: 1; }
        }
        .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .smaller { font-size: 0.75rem; }
      `}</style>
    </div>
  );
}

export default ReloadPrompt;
