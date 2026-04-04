import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, ExternalLink, ImageIcon, Loader2, Trash2, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";

const MediaModal = ({ isOpen, onClose, transactionId, loca }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchMedia();
    }
  }, [isOpen, transactionId]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      if (Array.isArray(transactionId)) {
        const allMedia = [];
        for (const id of transactionId) {
          const res = await axios.get(`${loca}/files/media/${id}`);
          allMedia.push(...res.data);
        }
        setMedia(allMedia);
      } else {
        const res = await axios.get(`${loca}/files/media/${transactionId}`);
        setMedia(res.data);
      }
    } catch (err) {
      console.error("Error fetching media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`${loca}/files/media/${deleteId}`);
      setMedia(prev => prev.filter(m => m.id !== deleteId));
      toast.success("Attachment removed");
      setDeleteId(null);
    } catch (err) {
      toast.error("Failed to delete attachment");
    }
  };

  const handleUploadMore = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // We need a transaction ID to upload. If it's an array, we pick the first one or prompt?
    // Usually, this modal is opened for a specific transactionId.
    const targetId = Array.isArray(transactionId) ? transactionId[0] : transactionId;
    if (!targetId) {
        toast.error("No valid transaction ID found to attach files.");
        return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("transactionId", targetId);
    formData.append("type", "LATE_ATTACHMENT");

    setIsUploading(true);
    const toastId = toast.loading("Uploading more images...");
    try {
      const res = await axios.post(`${loca}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Refresh media list
      fetchMedia();
      toast.success("Successfully added media", { id: toastId });
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.25rem' }}>
          <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <ImageIcon size={20} className="text-primary"/>
                Transaction Media Gallery
            </h5>
            <div className="d-flex align-items-center gap-2">
                <label className={`btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-2 ${isUploading ? 'disabled' : ''}`}>
                    <PlusCircle size={16} /> {isUploading ? "Uploading..." : "Add More"}
                    <input type="file" multiple hidden accept="image/*" onChange={handleUploadMore} disabled={isUploading} />
                </label>
                <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
            </div>
          </div>
          <div className="modal-body p-4" style={{ minHeight: '300px', maxHeight: '70vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-5">
                <Loader2 className="animate-spin text-primary mx-auto" size={40} />
                <p className="mt-2 text-muted">Refreshing gallery...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <ImageIcon size={48} className="opacity-25 mb-3" />
                <p>No media files found. You can add images using the "Add More" button above.</p>
              </div>
            ) : (
              <div className="row g-3">
                {media.map((file, idx) => (
                  <div key={idx} className="col-md-6 col-lg-4">
                    <div className="card h-100 border-0 shadow-sm overflow-hidden group position-relative">
                      <img
                        src={`${loca}/uploads/${file.fileName}`}
                        alt={`Attachment ${idx + 1}`}
                        className="card-img-top"
                        style={{ height: "180px", objectFit: "cover" }}
                      />
                      <div className="p-2 d-flex justify-content-between align-items-center bg-white border-top">
                        <small className="text-muted text-truncate w-50">{file.fileName}</small>
                        <div className="d-flex gap-1">
                            <a
                            href={`${loca}/uploads/${file.fileName}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-light border p-1 rounded-circle"
                            title="Open Full View"
                            >
                            <ExternalLink size={14} />
                            </a>
                            <button 
                                onClick={() => {
                                    setDeleteId(file.id);
                                    setIsConfirmOpen(true);
                                }}
                                className="btn btn-sm btn-outline-danger border p-1 rounded-circle"
                                title="Delete Attachment"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-dark fw-bold px-4 rounded-pill shadow-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Media"
        message="Are you sure you want to permanently remove this image/proof from this transaction? This cannot be undone."
        type="danger"
      />
    </div>
  );
};

export default MediaModal;
