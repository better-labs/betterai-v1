// Barrel export to ensure consistent import ordering regardless of file location
// This prevents webpack module resolution order from affecting hydration timing

export { Header } from './header.client'
export { Footer } from './footer'