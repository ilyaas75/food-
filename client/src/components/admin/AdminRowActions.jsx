export default function AdminRowActions({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }) {
  return (
    <div className="admin-row-actions">
      {onEdit && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onEdit}>
          {editLabel}
        </button>
      )}
      {onDelete && (
        <button type="button" className="btn btn-outline btn-sm btn-danger" onClick={onDelete}>
          {deleteLabel}
        </button>
      )}
    </div>
  );
}
