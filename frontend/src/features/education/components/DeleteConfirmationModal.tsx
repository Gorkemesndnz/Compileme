import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  title: string
  warningText: string
  onClose: () => void
  onConfirm: () => void
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  warningText,
  onClose,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-white dark:bg-zinc-950 p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 border-b border-red-500/10 pb-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider">
                  Geri Alınamaz İşlem
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-300">
              {warningText}
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                size="sm"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onConfirm}
                size="sm"
                className="shadow-[0_0_12px_rgba(239,68,68,0.3)] font-bold"
              >
                Her Şeyi Sil
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
