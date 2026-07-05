import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { IdeaResponse, useConvertIdea } from '../../api/ideas'

export const IdeaConvertPanel: React.FC<{ idea: IdeaResponse }> = ({ idea }) => {
  const navigate = useNavigate()
  const convertIdea = useConvertIdea()

  const handleConvert = async () => {
    try {
      const converted = await convertIdea.mutateAsync(idea.id)
      toast.success('Fikir projeye donusturuldu.')
      if (converted.convertedProjectId) {
        navigate(`/projects/${converted.convertedProjectId}`)
      }
    } catch {
      toast.error('Fikir projeye donusturulemedi.')
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5 dark:bg-cyan-500/5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">Projeye donustur</h2>
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Gelisim gunlugu ve arastirmalar proje hafizasina tasinir.
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleConvert}
        disabled={idea.status === 'CONVERTED' || convertIdea.isPending}
        className="w-full gap-2"
      >
        {convertIdea.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        {idea.status === 'CONVERTED' ? 'Projeye donustu' : 'Projeye donustur'}
      </Button>
    </section>
  )
}
