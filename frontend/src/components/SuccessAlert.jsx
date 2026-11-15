import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const SuccessAlert = (props) => {
  const message = props.message;
  const onClose = props.onClose;
  let duration = props.duration;

  if (duration === undefined) {
    duration = 4000;
  }

  useEffect(() => {
    if (!message) {
      return;
    }

    // Close the message after a short time.
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="toast-container" role="alert" aria-live="assertive">
      <div className="toast">
        <CheckCircle2 size={20} color="#10b981" />
        <span style={{ fontWeight: 600 }}>{message}</span>
        <button
          onClick={onClose}
          className="toast-close"
          aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default SuccessAlert;
