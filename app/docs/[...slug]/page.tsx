import { notFound } from 'next/navigation'
import { getDocBySlugAsync, getAllDocSlugs } from '@/lib/mdx'
import { DocLayout } from '@/components/docs/doc-layout'
import { AuthGuard } from '@/components/docs/auth-guard'

interface DocsPageProps {
  params: Promise<{
    slug: string[]
  }>
}

// Static params generation removed for minimal solution

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params
  const slugString = slug.join('/')
  const doc = await getDocBySlugAsync(slugString)
  
  if (!doc) {
    return {
      title: 'Page Not Found - BetterAI Docs',
    }
  }
  
  return {
    title: `${doc.metadata.title} - BetterAI Docs`,
    description: `Learn about ${doc.metadata.title} in the BetterAI documentation.`,
  }
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params
  const slugString = slug.join('/')
  const doc = await getDocBySlugAsync(slugString)
  
  if (!doc) {
    notFound()
  }
  
  return (
    <AuthGuard>
      <DocLayout doc={doc} />
    </AuthGuard>
  )
}