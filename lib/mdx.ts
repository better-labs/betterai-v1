import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'

export interface DocMetadata {
  title: string
  order: number
  tags: string[]
  slug: string
  section: string
}

export interface DocPage {
  metadata: DocMetadata
  content: MDXRemoteSerializeResult
}

export interface DocNavItem {
  title: string
  slug: string
  order: number
  section: string
}

const contentDir = join(process.cwd(), 'content', 'docs')

function getAllMdxFiles(dir: string, section = ''): string[] {
  const files: string[] = []
  const items = readdirSync(dir)
  
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath, item))
    } else if (item.endsWith('.mdx')) {
      const slug = item.replace(/\.mdx$/, '')
      files.push(section ? `${section}/${slug}` : slug)
    }
  }
  
  return files
}

export function getAllDocSlugs(): string[] {
  return getAllMdxFiles(contentDir)
}

// This function has been removed - use getDocBySlugAsync instead

export async function getDocBySlugAsync(slug: string): Promise<DocPage | null> {
  try {
    const parts = slug.split('/')
    const section = parts.length > 1 ? parts[0] : ''
    const filename = parts.length > 1 ? parts[1] : parts[0]
    
    const filePath = section 
      ? join(contentDir, section, `${filename}.mdx`)
      : join(contentDir, `${filename}.mdx`)
    
    const fileContents = readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)
    
    const serializedContent = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    })
    
    return {
      metadata: {
        title: data.title,
        order: data.order || 999,
        tags: data.tags || [],
        slug,
        section,
      },
      content: serializedContent,
    }
  } catch (error) {
    console.error(`Error loading doc: ${slug}`, error)
    return null
  }
}

// This function has been removed - use static docsNavigation from @/lib/docs-data instead