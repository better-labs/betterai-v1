'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { DocPage } from '@/lib/mdx'
import { DocSidebar } from './doc-sidebar'
import { DocSearch } from './doc-search'
import { DocContent } from './doc-content'

interface DocLayoutProps {
  doc: DocPage
}

export function DocLayout({ doc }: DocLayoutProps) {
  const posthog = usePostHog()
  
  useEffect(() => {
    if (posthog) {
      posthog.capture('doc_view', {
        doc_title: doc.metadata.title,
        doc_slug: doc.metadata.slug,
        doc_section: doc.metadata.section,
        doc_tags: doc.metadata.tags,
      })
    }
  }, [posthog, doc.metadata])
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            <h1 className="text-xl font-semibold">BetterAI Docs</h1>
            <div className="ml-auto">
              <DocSearch />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-8">
          <aside className="w-64 shrink-0">
            <DocSidebar currentSlug={doc.metadata.slug} />
          </aside>
          
          <main className="flex-1 min-w-0">
            <DocContent content={doc.content} />
          </main>
        </div>
      </div>
    </div>
  )
}