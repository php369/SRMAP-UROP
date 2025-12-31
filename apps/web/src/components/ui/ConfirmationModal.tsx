import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

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
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-100',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          textColor: 'text-red-800'
        };
      case 'success':
        return {
          bg: 'bg-green-100',
          confirmBg: 'bg-green-600 hover:bg-green-700',
          textColor: 'text-green-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-100',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          textColor: 'text-blue-800'
        };
      default:
        return {
          bg: 'bg-amber-100',
          confirmBg: 'bg-amber-600 hover:bg-amber-700',
          textColor: 'text-amber-800'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center mr-4`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">{message}</p>
          {details && (
            <div className={`${colors.bg} border border-opacity-20 rounded-lg p-3`}>
              <p className={`text-sm ${colors.textColor}`}>{details}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white ${colors.confirmBg} rounded-lg transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}