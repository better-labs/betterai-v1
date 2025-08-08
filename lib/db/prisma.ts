import { PrismaClient } from '../../lib/generated/prisma';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const enableQueryLogging = process.env.PRISMA_LOG_QUERIES === 'true'

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Toggle verbose query logging via env. Defaults off.
    log: enableQueryLogging ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
