import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  details?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  details
}: ConfirmationModalProps) {

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger': return 'bg-red-500/10 text-red-500';
      case 'success': return 'bg-green-500/10 text-green-500';
      case 'info': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-amber-500/10 text-amber-500';
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger': return 'error';
      case 'success': return 'success';
      case 'info': return 'primary';
      default: return 'warning';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full shrink-0 ${getTypeStyles()}`}>
            {getIcon()}
          </div>
          <div className="space-y-2">
            <p className="text-textSecondary leading-relaxed">{message}</p>
            {details && (
              <div className="bg-surface/50 rounded-lg p-3 text-sm text-textSecondary border border-border">
                {details}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-border/10">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={getButtonVariant()} onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}