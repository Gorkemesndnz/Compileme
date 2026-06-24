import React from 'react'
import { BookOpen, CheckCircle2, FileUp, Layers3, Link2, PlayCircle, Plus, UploadCloud } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { groupEducationsByType, mockEducations, EDUCATION_TYPE_LABELS } from './mockEducationData'
import { AddEducationCard, EducationCard } from './EducationCard'
import { EducationType } from './types'

const categoryOptions: EducationType[] = ['PROGRAMMING', 'LANGUAGE', 'OTHER']

const EmptyEducationOnboarding: React.FC = () => {
  const [category, setCategory] = React.useState<EducationType>('PROGRAMMING')

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white/70 p-6 text-slate-950 shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-content-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-slate-100">Ilk egitim odani kur</h2>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-700 dark:text-slate-300">
            Kategori, kaynak ve PDF notlarini birlikte tutan ilk calisma alanini buradan baslat.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">Kategori</span>
          <div className="grid grid-cols-3 gap-2">
            {categoryOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCategory(type)}
                className={`rounded-md border px-3 py-2 text-xs font-bold transition-all ${
                  category === type
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.12)] dark:text-cyan-200'
                    : 'border-slate-200 bg-white/65 text-slate-800 hover:border-cyan-500/30 dark:border-white/10 dark:bg-black/20 dark:text-slate-300'
                }`}
              >
                {EDUCATION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">Baslik</span>
          <input
            placeholder="Orn: Java Spring Boot"
            className="h-11 w-full rounded-md border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-950 shadow-sm placeholder:text-slate-500 dark:border-white/10 dark:bg-black/20 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">Aciklama</span>
          <textarea
            placeholder="Bu egitimde hangi konular takip edilecek?"
            className="min-h-[92px] w-full resize-none rounded-md border border-slate-200 bg-white/80 px-3 py-3 text-sm font-medium text-slate-950 shadow-sm placeholder:text-slate-500 dark:border-white/10 dark:bg-black/20 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">Kaynak Platform</span>
          <div className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 text-slate-950 shadow-sm dark:border-white/10 dark:bg-black/20 dark:text-slate-100">
            <Link2 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            <input
              placeholder="Udemy, Youtube, Kitap..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold placeholder:text-slate-500"
            />
          </div>
        </label>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">PDF Dropzone</span>
          <button
            type="button"
            className="flex h-24 w-full items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-white/60 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-cyan-500/40 hover:bg-white/80 dark:border-white/15 dark:bg-black/20 dark:text-slate-200 dark:hover:border-cyan-300/40"
          >
            <UploadCloud className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            PDF veya slayt birak
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.12)] transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
        >
          <Plus className="h-4 w-4" />
          Egitimi olustur
        </button>
      </div>
    </motion.section>
  )
}

export const EducationHub: React.FC = () => {
  const educations = mockEducations
  const groups = React.useMemo(() => groupEducationsByType(educations), [educations])
  const activeCount = React.useMemo(
    () => educations.filter((education) => education.status === 'ACTIVE').length,
    [educations]
  )
  const averageProgress = React.useMemo(() => {
    if (educations.length === 0) {
      return 0
    }

    return Math.round(educations.reduce((sum, item) => sum + item.progress_percent, 0) / educations.length)
  }, [educations])

  return (
    <div className="space-y-7">
      <PageHeader
        title="Egitim Komuta Merkezi"
        subtitle="Kaynaklar, pratikler ve moduler calisma odalari icin ana yonetim ussu."
      />

      {educations.length === 0 ? (
        <EmptyEducationOnboarding />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Aktif egitim', value: activeCount, icon: PlayCircle },
              { label: 'Toplam kategori', value: groups.length, icon: Layers3 },
              { label: 'Ortalama ilerleme', value: `${averageProgress}%`, icon: CheckCircle2 },
            ].map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="rounded-lg border border-slate-200 bg-white/70 p-4 text-slate-950 shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-400">{metric.label}</span>
                    <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-950 dark:text-slate-100">{metric.value}</div>
                </div>
              )
            })}
          </section>

          <section className="space-y-10">
            {groups.map((group) => (
              <div key={group.type} className="space-y-5">
                <div className="flex items-center gap-2 text-slate-950 dark:text-slate-100">
                  <FileUp className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  <h2 className="text-lg font-black">{group.label}</h2>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                    {group.educations.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                  <AddEducationCard
                    categoryLabel={group.label}
                    onClick={() => {
                      // Backend form wiring will be added when education mutations are connected.
                    }}
                  />
                  {group.educations.map((education) => (
                    <EducationCard key={education.id} education={education} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
