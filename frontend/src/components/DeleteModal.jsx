import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const DeleteModal = (props) => {
  const isOpen = props.isOpen;
  const onClose = props.onClose;
  const onConfirm = props.onConfirm;
  const hotelTitle = props.hotelTitle;
  let isDeleting = props.isDeleting;

  if (isDeleting === undefined) {
    isDeleting = false;
  }

  if (!isOpen) {
    return null;
  }

  let deleteButtonContent = 'Yes, Delete';
  if (isDeleting) {
    deleteButtonContent = (
      <>
        <Loader2 size={16} className="spinner" />
        <span>Deleting...</span>
      </>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
            Delete Hotel?
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Are you sure you want to delete <strong>"{hotelTitle}"</strong>? This will permanently remove the hotel record and its stored image from the server.
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isDeleting}
          >
            {deleteButtonContent}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
