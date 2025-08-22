// Custom ESLint rules to catch date serialization issues
module.exports = {
  rules: {
    // Warn when calling Date methods on potentially serialized data
    'no-direct-date-methods': {
      create(context) {
        return {
          MemberExpression(node) {
            // Flag calls like someVar.getTime() where we're not sure if it's a Date
            if (
              node.property.name === 'getTime' ||
              node.property.name === 'getFullYear' ||
              node.property.name === 'toISOString'
            ) {
              // If it's not obviously a Date constructor, warn
              if (node.object.type !== 'NewExpression' || 
                  node.object.callee.name !== 'Date') {
                context.report({
                  node,
                  message: 'Potential date serialization issue: ensure this is a Date object, not a string'
                })
              }
            }
          }
        }
      }
    }
  }
}
