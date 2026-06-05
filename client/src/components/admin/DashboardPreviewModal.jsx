import { Link } from 'react-router-dom';
import { X, ArrowRight } from './AdminIcons';

export default function DashboardPreviewModal({ title, subtitle, children, actionTo, actionLabel, onClose }) {
  return (
    <div className="dash-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="dash-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dash-modal-title"
      >
        <div className="dash-modal-header">
          <div>
            <h2 id="dash-modal-title">{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <button type="button" className="dash-modal-close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <div className="dash-modal-body">{children}</div>
        {actionTo && (
          <div className="dash-modal-footer">
            <Link to={actionTo} className="btn btn-primary" onClick={onClose}>
              {actionLabel || 'Open full page'}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
