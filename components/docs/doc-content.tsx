'use client'

import { useEffect, useState } from 'react'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { mdxComponents } from './mdx-components'

interface DocContentProps {
  content: MDXRemoteSerializeResult
}

export function DocContent({ content }: DocContentProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div className="animate-pulse h-96 bg-muted rounded" />
  }
  
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:no-underline">
      <MDXRemote {...content} components={mdxComponents} />
    </div>
  )
}