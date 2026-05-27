import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Flame, Sparkles, TrendingUp, ChevronRight, ChevronLeft, X, Tag } from 'lucide-react'
import { useProjects, useCatalogueStats, SearchField, SortKey } from '../api/projects'
import ProjectCard from '../components/project/ProjectCard'
import { ProjectType, PROJECT_TYPE_ICONS } from '../types'

const TYPES: ProjectType[] = ['WEB', 'IOS', 'ANDROID', 'DESKTOP_MAC', 'DESKTOP_WIN', 'DESKTOP_LINUX', 'CROSS_PLATFORM', 'OTHER']
const SEARCH_FIELDS: SearchField[] = ['all', 'title', 'tags', 'description']
const SORTS: SortKey[] = ['popular', 'new', 'downloads']

const gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
const selectArrow = {
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
}

function Skeletons({ count = 8 }: { count?: number }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-64 animate-pulse" />
      ))}
    </div>
  )
}

function TypeChip({ emoji, label, count, active, onClick }: { emoji: string; label: string; count?: number; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={'flex items-center gap-1.5 h-8 px-3 rounded-full text-sm border transition-colors ' +
        (active ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200')}>
      <span>{emoji}</span>
      <span>{label}</span>
      {count != null && <span className="text-[11px] text-gray-500">{count}</span>}
    </button>
  )
}

function SectionTitle({ icon, title, subtitle, onSeeAll }: { icon: React.ReactNode; title: string; subtitle: string; onSeeAll: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-end justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">{icon}</div>
        <div>
          <h2 className="text-xl font-semibold text-gray-100 leading-tight">{title}</h2>
          <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <button onClick={onSeeAll} className="text-sm text-gray-400 hover:text-brand-400 flex items-center gap-1 transition-colors">
        {t('catalogue.seeAll')} <ChevronRight size={14} />
      </button>
    </div>
  )
}

function Section({ icon, title, subtitle, sort, onSeeAll, onTagClick }: {
  icon: React.ReactNode; title: string; subtitle: string; sort: SortKey
  onSeeAll: () => void; onTagClick: (tag: string) => void
}) {
  const { data, isLoading } = useProjects({ sort, limit: 8 })
  const projects = data?.data ?? []
  if (!isLoading && projects.length === 0) return null
  return (
    <section className="mb-10">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      {isLoading ? <Skeletons count={4} /> : <div className={gridClass}>{projects.map((p) => <ProjectCard key={p.id} project={p} onTagClick={onTagClick} />)}</div>}
    </section>
  )
}

export default function CataloguePage() {
  const { t } = useTranslation()
  const stats = useCatalogueStats().data
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState<SearchField>('all')
  const [type, setType] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<SortKey>('popular')
  const [page, setPage] = useState(1)
  const [browseAll, setBrowseAll] = useState(false)

  const trimmed = search.trim()
  const showResults = !!trimmed || !!type || !!tag || browseAll

  const { data, isLoading, isError } = useProjects({
    search: trimmed || undefined,
    searchField: trimmed ? searchField : undefined,
    sort, type: type || undefined, tag: tag || undefined, page, limit: 20,
  })

  const resetAll = () => { setSearch(''); setType(''); setTag(''); setBrowseAll(false); setSort('popular'); setPage(1) }
  const handleTagClick = (tg: string) => { setTag(tg); setSearch(''); setBrowseAll(false); setPage(1) }
  const seeAll = (s: SortKey) => { setSort(s); setBrowseAll(true); setPage(1) }
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {!showResults && (
        <div className="mb-10 relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-8 sm:p-10">
          <div className="absolute -top-10 -right-10 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #4f6ef0, transparent 60%)' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              {t('catalogue.heroProjects', { count: stats?.total ?? 0 })} · {t('catalogue.heroThisWeek', { count: stats?.addedThisWeek ?? 0 })}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight max-w-2xl leading-tight">
              {t('catalogue.heroTitleLead')} <span className="text-brand-400">{t('catalogue.heroTitleAccent')}</span>
            </h1>
            <p className="text-gray-400 mt-3 max-w-xl">{t('catalogue.heroSubtitle')}</p>
          </div>
          <div className="relative mt-7 max-w-2xl flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Search size={16} /></div>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full h-12 pl-10 pr-32 rounded-lg bg-gray-900 border border-gray-800 focus:border-brand-500/60 focus:outline-none text-gray-100 placeholder-gray-600"
                placeholder={t('catalogue.searchPlaceholder')} />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <select value={searchField} onChange={(e) => setSearchField(e.target.value as SearchField)}
                  className="h-9 pl-3 pr-8 rounded-md bg-gray-800/80 border border-gray-700 text-sm text-gray-300 appearance-none cursor-pointer focus:outline-none" style={selectArrow}>
                  {SEARCH_FIELDS.map((f) => <option key={f} value={f}>{t(`catalogue.field_${f}`)}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact search in results mode */}
      {showResults && (
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Search size={16} /></div>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full h-11 pl-10 pr-32 rounded-lg bg-gray-900 border border-gray-800 focus:border-brand-500/60 focus:outline-none text-gray-100"
              placeholder={t('catalogue.searchPlaceholder')} />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <select value={searchField} onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="h-8 pl-3 pr-7 rounded-md bg-gray-800 border border-gray-700 text-xs text-gray-300 appearance-none cursor-pointer focus:outline-none" style={selectArrow}>
                {SEARCH_FIELDS.map((f) => <option key={f} value={f}>{t(`catalogue.field_${f}`)}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Type filters */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="text-xs uppercase tracking-wider text-gray-500 font-medium mr-1">{t('catalogue.typeLabel')}</span>
        <TypeChip emoji="✦" label={t('catalogue.allTypes')} count={stats?.total} active={!type} onClick={() => { setType(''); setPage(1) }} />
        {TYPES.map((tp) => (
          <TypeChip key={tp} emoji={PROJECT_TYPE_ICONS[tp]} label={t(`projectType.${tp}`)} count={stats?.byType?.[tp]}
            active={type === tp} onClick={() => { setType(tp === type ? '' : tp); setPage(1) }} />
        ))}
      </div>

      {/* Active tag chip */}
      {tag && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-gray-500 mr-1">{t('catalogue.filtersLabel')}</span>
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-500/15 border border-brand-500/40 text-brand-300 text-sm">
            <Tag size={12} /> {tag}
            <button onClick={() => { setTag(''); setPage(1) }} className="ml-1 -mr-1 hover:bg-brand-500/20 rounded p-0.5"><X size={12} /></button>
          </span>
          <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300 ml-2">{t('catalogue.clearAll')}</button>
        </div>
      )}

      {isError && <div className="text-red-400 text-center py-12">{t('catalogue.loadFailed')}</div>}

      {/* Browse mode — sections */}
      {!showResults && !isError && (
        <>
          <Section icon={<Flame size={18} style={{ color: '#fb923c' }} />} title={t('catalogue.section_popular')} subtitle={t('catalogue.section_popular_sub')} sort="popular" onSeeAll={() => seeAll('popular')} onTagClick={handleTagClick} />
          <Section icon={<Sparkles size={18} style={{ color: '#a78bfa' }} />} title={t('catalogue.section_new')} subtitle={t('catalogue.section_new_sub')} sort="new" onSeeAll={() => seeAll('new')} onTagClick={handleTagClick} />
          <Section icon={<TrendingUp size={18} style={{ color: '#4ade80' }} />} title={t('catalogue.section_downloads')} subtitle={t('catalogue.section_downloads_sub')} sort="downloads" onSeeAll={() => seeAll('downloads')} onTagClick={handleTagClick} />
        </>
      )}

      {/* Results mode */}
      {showResults && !isError && (
        <>
          <div className="flex items-end justify-between mb-5 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                {t('catalogue.resultsCount', { count: data?.meta.total ?? 0 })}
                {trimmed && <> <span className="text-brand-400 font-mono">"{trimmed}"</span></>}
              </h2>
              <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300 mt-1">← {t('catalogue.allCategories')}</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{t('catalogue.sortLabel')}</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1) }}
                className="h-9 pl-3 pr-8 rounded-md bg-gray-900 border border-gray-800 text-sm text-gray-200 appearance-none cursor-pointer focus:outline-none focus:border-gray-700" style={selectArrow}>
                {SORTS.map((s) => <option key={s} value={s}>{t(`catalogue.sort_${s}`)}</option>)}
              </select>
            </div>
          </div>

          {isLoading && <Skeletons />}
          {data && (
            <>
              {data.data.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-lg mb-2">{t('catalogue.noResults')}</p>
                  <p className="text-sm">{t('catalogue.noResultsHint')}</p>
                </div>
              ) : (
                <div className={`${gridClass} mb-8`}>
                  {data.data.map((p) => <ProjectCard key={p.id} project={p} onTagClick={handleTagClick} />)}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                    className="w-9 h-9 rounded-md bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-40 flex items-center justify-center"><ChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }).slice(0, 6).map((_, i) => {
                    const n = i + 1
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={'w-9 h-9 rounded-md text-sm ' + (n === page ? 'bg-brand-500 text-white font-medium' : 'bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-700')}>{n}</button>
                    )
                  })}
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                    className="w-9 h-9 rounded-md bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-40 flex items-center justify-center"><ChevronRight size={14} /></button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
