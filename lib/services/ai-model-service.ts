import type { PrismaClient, AiModel } from '@/lib/generated/prisma'

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

/**
 * AI Model service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Return raw models (no complex serialization needed)
 * - Support both PrismaClient and TransactionClient
 * - Clean named exports instead of object namespaces
 */

export async function getAllAIModels(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>
): Promise<AiModel[]> {
  return await db.aiModel.findMany({
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getAIModelById(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<AiModel | null> {
  return await db.aiModel.findUnique({
    where: { id }
  })
}

export async function getAIModelBySlug(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  slug: string
): Promise<AiModel | null> {
  return await db.aiModel.findFirst({
    where: { canonicalSlug: slug }
  })
}

export async function createAIModel(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  modelData: any
): Promise<AiModel> {
  return await db.aiModel.create({ data: modelData })
}

export async function updateAIModel(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string,
  modelData: Partial<any>
): Promise<AiModel | null> {
  return await db.aiModel.update({
    where: { id },
    data: { ...modelData, updatedAt: new Date() }
  })
}

export async function deleteAIModel(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  id: string
): Promise<boolean> {
  const result = await db.aiModel.delete({ where: { id } })
  return !!result
}

export async function upsertAIModels(
  db: PrismaClient,
  models: any[]
): Promise<AiModel[]> {
  if (models.length === 0) return []
  
  const transactions = models.map(model => 
    db.aiModel.upsert({
      where: { id: model.id },
      update: { ...model, updatedAt: new Date() },
      create: model
    })
  )
  
  return await db.$transaction(transactions)
}