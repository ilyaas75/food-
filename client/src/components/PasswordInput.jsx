import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  value,
  onChange,
  placeholder = '',
  required = false,
  minLength,
  id,
  autoComplete = 'current-password',
}) {
  const [visible, setVisible] = useState(false);
  const inputId = id || 'password-input';

  return (
    <div className="password-input-wrap">
      <input
        id={inputId}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="password-input-field"
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={0}
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}
