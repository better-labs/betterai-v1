/**
 * ESLint rule to prevent raw Prisma data in client components
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent raw Prisma data from being passed to client components',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      rawPrismaInClient: 'Raw Prisma query method "{{method}}" detected in client component context. Use "{{method}}Serialized" instead.',
      missingUseClient: 'Component appears to be a client component but missing "use client" directive.',
      prismaImportInClient: 'Prisma client imported in client component. Move database queries to server-side.',
    }
  },

  create(context) {
    let isClientComponent = false
    let hasUseClientDirective = false

    // List of Prisma query methods that should have Serialized alternatives
    const prismaQueryMethods = [
      'findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow',
      'create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany',
      'count', 'aggregate', 'groupBy'
    ]

    // Common raw query method patterns in your codebase
    const rawQueryPatterns = [
      /get.*ById(?!Serialized)/,
      /get.*ByMarket(?!Serialized)/,
      /get.*Recent(?!Serialized)/,
      /getPredictions(?!.*Serialized)/,
      /getMarket(?!.*Serialized)/,
      /getEvent(?!.*Serialized)/,
    ]

    return {
      Program(node) {
        // Check for "use client" directive
        const firstStatement = node.body[0]
        if (firstStatement && firstStatement.type === 'ExpressionStatement' &&
            firstStatement.expression.type === 'Literal' &&
            firstStatement.expression.value === 'use client') {
          hasUseClientDirective = true
          isClientComponent = true
        }

        // Check for React hooks (indicating client component)
        const sourceCode = context.getSourceCode().getText()
        if (sourceCode.includes('useState') || sourceCode.includes('useEffect') || 
            sourceCode.includes('useCallback') || sourceCode.includes('useMemo')) {
          isClientComponent = true
        }
      },

      ImportDeclaration(node) {
        if (isClientComponent && node.source.value.includes('@prisma/client')) {
          context.report({
            node,
            messageId: 'prismaImportInClient',
          })
        }
      },

      CallExpression(node) {
        if (!isClientComponent) return

        // Check for raw Prisma query method calls
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name

          // Check if it's a raw query method
          if (rawQueryPatterns.some(pattern => pattern.test(methodName))) {
            context.report({
              node,
              messageId: 'rawPrismaInClient',
              data: {
                method: methodName
              },
              fix(fixer) {
                // Suggest adding "Serialized" suffix
                return fixer.replaceText(node.callee.property, `${methodName}Serialized`)
              }
            })
          }

          // Check for direct Prisma query methods
          if (prismaQueryMethods.includes(methodName)) {
            const objectName = node.callee.object.name
            if (objectName === 'prisma' || objectName?.includes('prisma')) {
              context.report({
                node,
                messageId: 'rawPrismaInClient',
                data: {
                  method: `${objectName}.${methodName}`
                }
              })
            }
          }
        }
      },

      'Program:exit'() {
        // Reset for next file
        isClientComponent = false
        hasUseClientDirective = false
      }
    }
  }
}