'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertCircle, AlertTriangle, Trash2, RotateCcw, ShieldAlert, Loader2 } from 'lucide-react'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  type?: 'single' | 'multiple' | 'all' | 'reset' | 'schedule_reset' | 'device_reset' | 'danger'
  count?: number
  loading?: boolean
  confirmText?: string
  cancelText?: string
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'single',
  count = 0,
  loading = false,
  confirmText,
  cancelText = 'Batal',
}: ConfirmationDialogProps) {
  const isReset = type === 'reset' || type === 'schedule_reset' || type === 'device_reset'
  const isDanger = type === 'all' || type === 'danger' || type === 'multiple' || type === 'single'

  const resolvedConfirmText = confirmText || (isReset ? 'Ya, Reset' : 'Ya, Hapus')

  const icon = isReset ? (
    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
      <RotateCcw className="w-5 h-5" />
    </div>
  ) : isDanger ? (
    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
      {type === 'all' ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
    </div>
  ) : (
    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
      <AlertCircle className="w-5 h-5" />
    </div>
  )

  const confirmBtnColor = isReset
    ? 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
    : 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
          {icon}
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>

        {count > 0 && (type === 'multiple' || type === 'all') && (
          <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-rose-700">
              {count} data pemilih terkait akan dihapus permanen.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm()
              onClose()
            }}
            disabled={loading}
            className={`inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmBtnColor}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              resolvedConfirmText
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
