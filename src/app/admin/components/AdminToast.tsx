'use client'

import React from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface CustomToastProps {
  t: { id: string; visible: boolean }
  type: ToastType
  title: string
  description?: string
}

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
}

const BADGES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function ToastContent({ t, type, title, description }: CustomToastProps) {
  return (
    <div
      className={`${
        t.visible ? 'animate-in fade-in-0 slide-in-from-top-2' : 'animate-out fade-out-0'
      } max-w-md w-full bg-white border border-slate-200 shadow-xl shadow-slate-900/5 rounded-xl p-4 flex items-start gap-3 pointer-events-auto transition-all`}
    >
      <div className="pt-0.5">{ICONS[type]}</div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed break-words">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function showAdminToast(
  title: string,
  type: ToastType = 'info',
  description?: string
) {
  return toast.custom(
    (t) => (
      <ToastContent
        t={t}
        type={type}
        title={title}
        description={description}
      />
    ),
    {
      duration: type === 'error' ? 5000 : 3500,
      position: 'top-right',
    }
  )
}
