import { db } from '@/lib/db'
import { aiModels } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { AIModel, NewAIModel } from '@/lib/types'
import { sql } from 'drizzle-orm'

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

export async function getAllAIModels(): Promise<AIModel[]> {
  return await db.query.aiModels.findMany({
    orderBy: (aiModels, { desc }) => [desc(aiModels.updatedAt)]
  })
}

export async function getAIModelById(id: string): Promise<AIModel | null> {
  const result = await db.query.aiModels.findFirst({
    where: (aiModels, { eq }) => eq(aiModels.id, id)
  })
  return result || null
}

export async function getAIModelBySlug(slug: string): Promise<AIModel | null> {
  const result = await db.query.aiModels.findFirst({
    where: (aiModels, { eq }) => eq(aiModels.canonicalSlug, slug)
  })
  return result || null
}

export async function createAIModel(modelData: NewAIModel): Promise<AIModel> {
  const [result] = await db.insert(aiModels).values(modelData).returning()
  return result
}

export async function updateAIModel(id: string, modelData: Partial<NewAIModel>): Promise<AIModel | null> {
  const [result] = await db
    .update(aiModels)
    .set({ ...modelData, updatedAt: new Date() })
    .where(eq(aiModels.id, id))
    .returning()
  return result || null
}

export async function deleteAIModel(id: string): Promise<boolean> {
  const result = await db.delete(aiModels).where(eq(aiModels.id, id))
  return result.rowCount > 0
}

export async function upsertAIModels(models: NewAIModel[]): Promise<AIModel[]> {
  if (models.length === 0) return []
  
  const results = await db
    .insert(aiModels)
    .values(models)
    .onConflictDoUpdate({
      target: aiModels.id,
      set: {
        name: sql`EXCLUDED.name`,
        created: sql`EXCLUDED.created`,
        description: sql`EXCLUDED.description`,
        architecture: sql`EXCLUDED.architecture`,
        topProvider: sql`EXCLUDED.top_provider`,
        pricing: sql`EXCLUDED.pricing`,
        canonicalSlug: sql`EXCLUDED.canonical_slug`,
        contextLength: sql`EXCLUDED.context_length`,
        huggingFaceId: sql`EXCLUDED.hugging_face_id`,
        perRequestLimits: sql`EXCLUDED.per_request_limits`,
        supportedParameters: sql`EXCLUDED.supported_parameters`,
        updatedAt: new Date(),
      }
    })
    .returning()
  
  return results
}

 