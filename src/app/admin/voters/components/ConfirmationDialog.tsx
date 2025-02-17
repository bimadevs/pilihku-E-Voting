import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: 'single' | 'multiple' | 'all' | 'reset'
  count?: number
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'single',
  count = 0
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600">{message}</p>
          {type === 'multiple' && (
            <p className="mt-2 text-sm text-gray-500 bg-red-100 p-2 rounded-md">
              {count} data pemilih akan dihapus
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              type === 'reset' 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {type === 'reset' ? 'Reset' : 'Hapus'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 