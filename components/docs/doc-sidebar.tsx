'use client'

import Link from 'next/link'
import { DocNavItem, docsNavigation } from '@/lib/docs-data'
import { cn } from '@/lib/utils'

interface DocSidebarProps {
  currentSlug: string
}

interface GroupedDocs {
  [section: string]: DocNavItem[]
}

export function DocSidebar({ currentSlug }: DocSidebarProps) {
  const groupedDocs = docsNavigation.reduce<GroupedDocs>((acc, doc) => {
    const section = doc.section || 'root'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(doc)
    return acc
  }, {})
  
  const sectionOrder = ['overview', 'guides', 'legal']
  const sectionTitles = {
    overview: 'Overview',
    guides: 'Guides',
    legal: 'Legal',
    root: 'General'
  }
  
  return (
    <nav className="sticky top-8">
      <div className="space-y-6">
        {sectionOrder.map((sectionKey) => {
          const sectionDocs = groupedDocs[sectionKey]
          if (!sectionDocs || sectionDocs.length === 0) return null
          
          return (
            <div key={sectionKey}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                {sectionTitles[sectionKey as keyof typeof sectionTitles] || sectionKey}
              </h3>
              <ul className="space-y-1">
                {sectionDocs.map((doc) => (
                  <li key={doc.slug}>
                    <Link
                      href={`/docs/${doc.slug}`}
                      className={cn(
                        'block px-2 py-1 text-sm rounded-md transition-colors hover:bg-muted',
                        currentSlug === doc.slug
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        
        {/* Contact section */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            Contact
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/docs/contact"
                className={cn(
                  'block px-2 py-1 text-sm rounded-md transition-colors hover:bg-muted',
                  currentSlug === 'contact'
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}