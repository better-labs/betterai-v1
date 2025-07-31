require('whatwg-fetch')

// Add TextDecoder polyfill for Node.js environment
global.TextDecoder = global.TextDecoder || require('util').TextDecoder
global.TextEncoder = global.TextEncoder || require('util').TextEncoder

// Add any other Jest setup here 