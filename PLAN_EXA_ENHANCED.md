# Exa Research Enhancement Plan

## Overview
Task plan for implementing enhanced Exa.ai content retrieval with two advanced approaches beyond the basic drop-in fix.

## Option 2: Two-Step Approach for Production Reliability

### Task Breakdown

#### Phase 2A: Core Two-Step Implementation
- [ ] Create new function `performExaResearchTwoStep()` in research-service-v2.ts
- [ ] Implement Step 1: Search-only API call to `/search` endpoint
  - Remove `text` and `highlights` parameters 
  - Focus on getting high-quality URLs only
- [ ] Implement Step 2: Content retrieval via `/contents` endpoint
  - Add `maxCharacters: 8000` for content size control
  - Include `text`, `highlights`, and optional `summary` parameters
  - Add `livecrawlTimeout: 8000` for fresh content when needed

#### Phase 2B: Error Handling & Resilience  
- [ ] Parse `statuses[]` array from `/contents` response
- [ ] Implement per-URL error tracking and logging
- [ ] Create graceful fallback when individual URLs fail:
  - Skip failed URLs rather than failing entire request
  - Log failed URLs with error codes for debugging
  - Ensure minimum content threshold (e.g., at least 3/10 URLs succeed)

#### Phase 2C: Performance Optimization
- [ ] Add timeout handling for both API calls
- [ ] Implement retry logic for failed URLs (max 2 retries)
- [ ] Add content quality validation (minimum character length, relevance check)
- [ ] Cache failed URLs temporarily to avoid re-fetching

### Implementation Notes
- Maintain backward compatibility with existing `performExaResearch()`
- Add comprehensive error logging for production debugging
- Consider adding metrics/telemetry for success rates

---

## Option 3: Configurable Approach

### Task Breakdown

#### Phase 3A: Interface Design
- [ ] Add `contentMode?: 'light' | 'heavy'` parameter to `performExaResearch()`
- [ ] Update function signature and JSDoc documentation
- [ ] Add type definitions for content mode options

#### Phase 3B: Routing Logic Implementation
- [ ] Create router function to choose between approaches:
  - `'light'` → Use current one-step approach (post drop-in fix)
  - `'heavy'` → Use two-step approach from Option 2
  - Default to `'light'` for backward compatibility
- [ ] Add configuration validation and error handling

#### Phase 3C: Market-Based Intelligence
- [ ] Implement market complexity detection:
  - Sports markets → `'light'` (faster, real-time needs)
  - Financial/Political markets → `'heavy'` (more thorough research needed)
  - High-stakes markets (large volume) → `'heavy'`
- [ ] Add market metadata to influence content mode selection
- [ ] Create configurable thresholds for automatic mode selection

#### Phase 3D: Performance Monitoring
- [ ] Add timing metrics for both approaches
- [ ] Track content quality scores (length, relevance, link count)
- [ ] Implement A/B testing capability to compare approaches
- [ ] Add admin controls to override content mode per market type

### Advanced Features (Optional)
- [ ] Smart caching based on content mode (heavy mode = longer cache TTL)
- [ ] Parallel execution for heavy mode (search + initial content fetch)
- [ ] Content summarization for heavy mode results
- [ ] Rate limiting awareness (heavy mode uses more API calls)

---

## Implementation Priority
1. **Option 2** (Two-Step) - More robust, production-ready
2. **Option 3** (Configurable) - Best long-term solution, requires Option 2

## Success Metrics
- Content quality: Average character count per result
- Reliability: Success rate of content retrieval
- Performance: Average response time per mode
- User satisfaction: Prediction accuracy improvements

## Risk Considerations
- API rate limiting with two-step approach (2x API calls)
- Increased complexity in error handling and debugging
- Potential performance regression for simple markets
- Need for comprehensive testing across market types