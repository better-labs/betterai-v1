# Exa Research Enhancement Plan

## Overview
Task plan for implementing enhanced Exa.ai content retrieval with robust two-step approach beyond the basic drop-in fix.

## Option 2: Two-Step Approach for Production Reliability

### Task Breakdown

#### Phase 2A: Core Two-Step Implementation
- [ ] Create new function `performExaResearchTwoStep()` in research-service-v2.ts
- [ ] Implement Step 1: Search-only API call to `/search` endpoint
  - Remove `text` and `highlights` parameters 
  - Focus on getting high-quality URLs only
  - Limit to top 10 URLs for performance
- [ ] Implement Step 2: Content retrieval via `/contents` endpoint
  - Add `maxCharacters: 8000` for content size control
  - Include `text`, `highlights`, and optional `summary` parameters
  - Add `livecrawlTimeout: 8000` for fresh content when needed
- [ ] **Response JSON Structure Optimization:**
  - Save `relevant_information` (content) first in response
  - Limit `links` array to maximum 10 URLs 
  - Position `links` array at bottom of JSON structure
  - Ensure content takes priority over metadata in response ordering

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

## Implementation Priority
1. **Option 2** (Two-Step) - More robust, production-ready approach

## Data Structure Requirements

### ResearchResult JSON Format (Optimized)
```typescript
interface ResearchResult {
  // CONTENT FIRST - Primary research data
  relevant_information: string        // Main content - appears first
  
  // METADATA - Secondary information  
  source: string
  timestamp: Date
  confidence_score?: number
  sentiment_analysis?: string        // Grok only
  key_accounts?: string[]           // Grok only
  
  // LINKS LAST - Maximum 10 URLs at bottom of structure
  links: string[]                   // Limited to 10, positioned last
}
```

### Implementation Requirements
- **Content Priority**: `relevant_information` must be first property
- **Link Limitation**: Maximum 10 URLs in `links` array
- **JSON Ordering**: Links positioned as last property in response
- **Performance**: Smaller JSON payloads improve caching and network transfer

## Success Metrics
- Content quality: Average character count per result
- Reliability: Success rate of content retrieval
- Performance: Average response time per mode
- **Data efficiency**: Response size reduction with 10-link limit
- User satisfaction: Prediction accuracy improvements

## Risk Considerations
- API rate limiting with two-step approach (2x API calls)
- Increased complexity in error handling and debugging
- Potential performance regression for simple markets
- **Link truncation**: May lose valuable sources beyond top 10
- Need for comprehensive testing across market types