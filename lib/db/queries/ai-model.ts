import { prisma } from "../prisma"
import type { AiModel } from '../../../lib/generated/prisma';

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

// AI Model queries
export const aiModelQueries = {
  getAllAIModels: async (): Promise<AiModel[]> => {
    return await prisma.aiModel.findMany({
      orderBy: { updatedAt: 'desc' }
    })
  },
  getAIModelById: async (id: string): Promise<AiModel | null> => {
    return await prisma.aiModel.findUnique({
      where: { id }
    })
  },
  getAIModelBySlug: async (slug: string): Promise<AiModel | null> => {
    return await prisma.aiModel.findFirst({
      where: { canonicalSlug: slug }
    })
  },
  createAIModel: async (modelData: any): Promise<AiModel> => {
    return await prisma.aiModel.create({ data: modelData })
  },
  updateAIModel: async (id: string, modelData: Partial<any>): Promise<AiModel | null> => {
    return await prisma.aiModel.update({
      where: { id },
      data: { ...modelData, updatedAt: new Date() }
    })
  },
  deleteAIModel: async (id: string): Promise<boolean> => {
    const result = await prisma.aiModel.delete({ where: { id } })
    return !!result
  },
  upsertAIModels: async (models: any[]): Promise<AiModel[]> => {
    if (models.length === 0) return []
    
    const transactions = models.map(model => 
      prisma.aiModel.upsert({
        where: { id: model.id },
        update: { ...model, updatedAt: new Date() },
        create: model
      })
    )
    
    return await prisma.$transaction(transactions)
  }
}