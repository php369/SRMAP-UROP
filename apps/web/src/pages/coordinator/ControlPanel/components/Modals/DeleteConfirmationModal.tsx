
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../components/ui/dialog';
import { Button } from '../../../../../components/ui/Button';
import { Window } from '../../types';
import { formatDateForDisplay } from '../../utils/dateTimeUtils';
import { Trash2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  window: Window | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  bulkCount?: number;
}

export function DeleteConfirmationModal({
  isOpen,
  window,
  onConfirm,
  onCancel,
  loading,
  bulkCount = 0
}: DeleteConfirmationModalProps) {
  // Even if window is null, we render Dialog to handle open state smoothly if needed, 
  // but logically if it's null we shouldn't show content. 
  // However, for exit animations to work, the component might need to stay mounted but closed.
  // We'll rely on the parent controlling `isOpen` and `window`.

  const isBulk = bulkCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onCancel()}>
      <DialogContent className="max-w-md">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-full shadow-lg border border-slate-100">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-600 animate-pulse">
                {isBulk ? `Deleting ${bulkCount} Windows...` : 'Deleting Window...'}
              </p>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            {isBulk ? `Delete ${bulkCount} Windows` : 'Delete Window'}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the window configuration{isBulk ? 's' : ''} from the database.
          </DialogDescription>
        </DialogHeader>

        {(window || isBulk) && (
          <div className="space-y-4 py-2">
            {/* Critical Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-amber-800">Critical Warning</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Deleting {isBulk ? 'these windows' : 'this window'} may <strong>break the sequential workflow</strong> for associated projects.
                  Future windows depending on {isBulk ? 'these phases' : 'this phase'} might become inconsistent or unreachable.
                </p>
              </div>
            </div>

            {/* Window Details Card (Single) */}
            {window && !isBulk && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium text-foreground">
                    {window.windowType === 'grade_release' ? 'Grade Release' : window.windowType.charAt(0).toUpperCase() + window.windowType.slice(1)}
                    {window.assessmentType && <span className="text-muted-foreground ml-1">({window.assessmentType})</span>}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {window.projectType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Start Date</span>
                    <span className="font-mono text-foreground">{formatDateForDisplay(window.startDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block mb-0.5">End Date</span>
                    <span className="font-mono text-foreground">{formatDateForDisplay(window.endDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Info (List of project types involved maybe?) */}
            {isBulk && (
              <div className="rounded-lg border bg-blue-50/50 p-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  You are about to delete <strong>{bulkCount}</strong> assessment windows across different project types.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {isBulk ? `Delete ${bulkCount} Windows` : 'Delete Window'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}