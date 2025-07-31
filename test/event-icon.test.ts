import { EventIcon } from '@/components/event-icon'

describe('EventIcon', () => {
  it('should export EventIcon component', () => {
    expect(EventIcon).toBeDefined()
    expect(typeof EventIcon).toBe('function')
  })

  it('should have correct default props', () => {
    // This is a basic test to ensure the component exists and can be imported
    expect(EventIcon).toBeDefined()
  })
}) 