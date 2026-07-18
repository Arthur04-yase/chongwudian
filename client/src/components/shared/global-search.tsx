import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Phone, UserRound, PawPrint, Command } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: 'customer' | 'pet'
  id: number
  label: string
  sub: string
  customerId?: number
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl+K / Cmd+K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen((prev) => !prev)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 搜索
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const [custRes] = await Promise.allSettled([
          apiClient.get(`/api/customers?search=${query}&pageSize=3`),
        ])

        // Search customers only (pet search via API is complex, customers cover 90% use case)
        const customers: SearchResult[] = []
        if (custRes.status === 'fulfilled' && custRes.value.data.success) {
          for (const c of custRes.value.data.data || []) {
            customers.push({ type: 'customer', id: c.id, label: c.name, sub: `${c.phone} · ${c.petCount}只宠物` })
          }
        }
        setResults(customers)
      } catch {
        setResults([])
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // 键盘导航
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        const r = results[selectedIndex]
        navigate(r.type === 'customer' ? `/customers/${r.id}` : `/pets/${r.id}`)
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, results, selectedIndex, navigate])

  // 聚焦
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder="搜索客户姓名或手机号..."
            className="border-0 bg-transparent h-12 text-base shadow-none focus-visible:ring-0"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            未找到匹配的客户
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto p-2">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  i === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'
                )}
                onClick={() => {
                  navigate(r.type === 'customer' ? `/customers/${r.id}` : `/pets/${r.id}`)
                  setOpen(false)
                }}
              >
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  r.type === 'customer' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {r.type === 'customer' ? <UserRound className="h-4 w-4" /> : <PawPrint className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />{r.sub}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">⏎</span>
              </button>
            ))}
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            输入客户姓名或手机号搜索，支持键盘 ↑↓ 导航
          </div>
        )}
      </div>

      {/* 遮罩 */}
      <div className="fixed inset-0 -z-10 bg-black/20" />
    </div>
  )
}
