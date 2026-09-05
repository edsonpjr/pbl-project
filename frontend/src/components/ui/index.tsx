import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const buttonStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-accent-fg)',
    color: 'var(--color-fg-onEmphasis)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--color-canvas-subtle)',
    color: 'var(--color-fg-default)',
    border: '1px solid var(--color-border-default)',
  },
  danger: {
    background: 'var(--color-danger-fg)',
    color: 'var(--color-fg-onEmphasis)',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-fg-muted)',
    border: '1px solid transparent',
  },
  success: {
    background: 'var(--color-success-emphasis)',
    color: 'var(--color-fg-onEmphasis)',
    border: '1px solid transparent',
  },
};

const buttonSizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '6px 16px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '10px 24px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
};

export function Button({
  variant = 'primary', size = 'md', loading = false,
  fullWidth = false, leftIcon, children, disabled, style, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...buttonStyles[variant],
        ...buttonSizes[size],
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity var(--transition), filter var(--transition)',
        outline: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading)
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.9)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.filter = '';
      }}
      {...props}
    >
      {loading ? <Spinner size={14} /> : leftIcon}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-fg-default)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          padding: '6px 12px',
          fontSize: '14px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-fg-default)',
          background: 'var(--color-canvas-default)',
          border: `1px solid ${error ? 'var(--color-danger-fg)' : 'var(--color-border-default)'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          width: '100%',
          transition: 'border-color var(--transition), box-shadow var(--transition)',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent-fg)';
          e.currentTarget.style.boxShadow   = '0 0 0 3px var(--color-accent-muted)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--color-danger-fg)'
            : 'var(--color-border-default)';
          e.currentTarget.style.boxShadow = '';
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-danger-fg)' }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, style, id, ...props }: TextareaProps) {
  const areaId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={areaId}
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-fg-default)',
          background: 'var(--color-canvas-default)',
          border: `1px solid ${error ? 'var(--color-danger-fg)' : 'var(--color-border-default)'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          width: '100%',
          resize: 'vertical',
          minHeight: '80px',
          transition: 'border-color var(--transition), box-shadow var(--transition)',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent-fg)';
          e.currentTarget.style.boxShadow   = '0 0 0 3px var(--color-accent-muted)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.boxShadow   = '';
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--color-danger-fg)' }}>{error}</span>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, style, id, ...props }: SelectProps) {
  const selId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={selId}
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)' }}
        >
          {label}
        </label>
      )}
      <select
        id={selId}
        style={{
          padding: '6px 12px',
          fontSize: '14px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-fg-default)',
          background: 'var(--color-canvas-default)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: string;
}

export function Card({ children, style, onClick, hoverable, padding = 'var(--space-5)' }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-canvas-default)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding,
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick || hoverable ? 'pointer' : undefined,
        transition: hoverable ? 'box-shadow var(--transition), border-color var(--transition), transform var(--transition)' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-accent-fg)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-default)';
          (e.currentTarget as HTMLDivElement).style.transform = '';
        }
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'accent' | 'xp';

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--color-canvas-subtle)', color: 'var(--color-fg-muted)', border: '1px solid var(--color-border-default)' },
  success: { background: 'var(--color-success-subtle)', color: 'var(--color-success-fg)', border: '1px solid transparent' },
  danger:  { background: 'var(--color-danger-subtle)',  color: 'var(--color-danger-fg)',  border: '1px solid transparent' },
  warning: { background: 'var(--color-warning-subtle)', color: 'var(--color-warning-fg)', border: '1px solid transparent' },
  accent:  { background: 'var(--color-accent-subtle)',  color: 'var(--color-accent-fg)',  border: '1px solid transparent' },
  xp:      { background: 'var(--color-xp-subtle)',      color: 'var(--color-xp-gold)',    border: '1px solid transparent' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <span
      style={{
        ...badgeStyles[variant],
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;     // 0–100
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  value, color = 'var(--color-accent-fg)',
  height = 8, showLabel = false, animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-fg-muted)' }}>
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--color-border-muted)',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            background: clamped === 100 ? 'var(--color-success-emphasis)' : color,
            borderRadius: height / 2,
            transition: animated ? 'width 0.6s ease' : undefined,
          }}
        />
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'success' | 'danger' | 'warning';

const alertStyles: Record<AlertVariant, React.CSSProperties> = {
  info:    { background: 'var(--color-accent-muted)',  borderColor: 'var(--color-accent-fg)',  color: 'var(--color-accent-fg)' },
  success: { background: 'var(--color-success-muted)', borderColor: 'var(--color-success-fg)', color: 'var(--color-success-fg)' },
  danger:  { background: 'var(--color-danger-muted)',  borderColor: 'var(--color-danger-fg)',  color: 'var(--color-danger-fg)' },
  warning: { background: 'var(--color-warning-subtle)', borderColor: 'var(--color-warning-fg)', color: 'var(--color-warning-fg)' },
};

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Alert({ variant = 'info', children, style }: AlertProps) {
  return (
    <div
      style={{
        ...alertStyles[variant],
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid',
        fontSize: '14px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--color-canvas-default)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          width: '100%', maxWidth: width,
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.15s ease',
        }}
      >
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border-muted)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-fg-muted)', fontSize: '18px', lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 'var(--space-5)' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: React.CSSProperties }) {
  return (
    <hr style={{
      border: 'none',
      borderTop: '1px solid var(--color-border-muted)',
      margin: 0,
      ...style,
    }} />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--space-12)',
      gap: 'var(--space-3)', textAlign: 'center',
    }}>
      <span style={{ fontSize: '40px' }}>{icon}</span>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', maxWidth: 340 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
}
