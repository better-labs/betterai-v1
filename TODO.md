# Popular Tags Filter Implementation Plan

## Task Overview
Add "Popular Tags Filter" functionality to trending markets page by completing missing pieces in existing infrastructure.

## Context
-  Database schema complete (Tag, EventTag models)
-  Service layer complete (tag-service.ts with volume-based sorting)
-  tRPC router complete (tags.getPopular endpoint)
-  Base component exists in /shared/ui/popular-tag-filter.client.tsx

## High Level Todos
- Implement a new PopularTagsList component in /shared/ui/popular-tag-list.client.tsx that allows the user to select one tag at a time. That selected tag then filters the events shown in "TrendingEvents" component.
- Add state management in trending-markets.client.tsx to keep track of which tag is currently selected by the user.
- Add the list of tags as a horizontal scrollable div that stretches across the page, similar to polymarket.com landing page.
- Leverage existing best practices, components and typography from design-system.ts or suggest additions to the design system if they do not yet exist for this component.
- Single selection instead of multiple selection
- No "Clear filters" button needed ("All" serves this purpose)
- Simplified props interface
- Mobile-first horizontal scrolling design


## Mobile-First Polymarket Style UI

**Design Requirements** (based on Polymarket screenshots):
- **Horizontal scrollable pills**: Tags display as rounded pill buttons in a horizontal scrolling row
- **"All" first**: Default "All" option positioned first, followed by category tags  
- **Single selection**: One tag active at a time (like Polymarket), not multiple selection as originally planned
- **Mobile-optimized**: Touch-friendly sizing (minimum 44px touch target), smooth horizontal scrolling
- **Clean styling**: Minimal design with clear active/inactive states using design system tokens
- **Positioning**: Placed below the main "Trending Markets" header, full width container

**Updated Component Interface**:
```typescript
interface PopularTagsListProps {
  tags: Array<Tag & { totalVolume?: number }>
  selectedTagId: string | null  // Single selection, not array
  onTagSelect: (tagId: string | null) => void  // null for "All"
  className?: string
}
```

**Updated State Management**:
```typescript
const [selectedTagId, setSelectedTagId] = useState<string | null>(null)  // Single selection

const handleTagSelect = (tagId: string | null) => {
  setSelectedTagId(tagId)
}
```




## Implementation Tasks

### Phase 1: Backend - Add Tag Filtering Support (15 mins)
1. **Update markets.trending endpoint**
   - Add `tagIds?: string[]` parameter to GetMarketsInput schema in `/lib/trpc/schemas/market.ts`
   - Add tag filtering logic to trending markets query in `/lib/trpc/routers/markets.ts`
   - Filter markets where `event.eventTags.some(et => tagIds.includes(et.tagId))`
   - Test endpoint returns filtered results

### Phase 2: Component Creation (15 mins)
2. **Create PopularTagsList component**
   - **Note**: TagFilter already exists at `/shared/ui/popular-tag-filter.client.tsx` (no move needed)
   - Copy existing TagFilter � new `/shared/ui/popular-tag-list.client.tsx`
   - Update PopularTagsList for mobile-first horizontal scrolling:
     - Rename component `TagFilter` � `PopularTagsList`
     - Update props interface for single selection:
       ```typescript
       interface PopularTagsListProps {
         tags: Array<Tag & { totalVolume?: number }>
         selectedTagId: string | null  // Single selection
         onTagSelect: (tagId: string | null) => void
         className?: string
       }
       ```
     - Update styling for horizontal scrolling pills:
       - Horizontal flex container with scroll-x-auto
       - Touch-friendly pill buttons (min 44px height)
       - "All" button first, followed by tag pills
       - Clear active/inactive states
   - Ensure design system token usage

### Phase 3: State Management (10 mins)
3. **Add state management to trending-markets.client.tsx**
   - Add missing state variables (single selection):
     ```typescript
     const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
     ```
   - Add popular tags query:
     ```typescript
     const { 
       data: popularTagsData, 
       isLoading: tagsLoading 
     } = trpc.tags.getPopular.useQuery(
       { limit: 8 }, 
       { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
     )
     const popularTags = popularTagsData?.data || []
     ```
   - Add tag selection handler (simplified for single selection):
     ```typescript
     const handleTagSelect = (tagId: string | null) => {
       setSelectedTagId(tagId)  // null for "All"
     }
     ```

### Phase 4: Integration (10 mins)
4. **Integrate tag filtering with markets query**
   - Update `trpc.markets.trending.useQuery` to include `tagIds: selectedTagId ? [selectedTagId] : undefined`
   - Import `PopularTagsList` component from `/shared/ui/popular-tag-list.client`
   - Uncomment the Popular Tags Filter section in trending-markets.client.tsx
   - Update the commented code to use correct component and props:
     ```tsx
     {!tagsLoading && popularTags.length > 0 && (
       <div className="w-full">
         <PopularTagsList 
           tags={popularTags} 
           selectedTagId={selectedTagId}
           onTagSelect={handleTagSelect}
         />
       </div>
     )}
     ```

### Phase 5: Testing & Polish (10 mins)
5. **Test and verify functionality**
   - Test tag selection (single selection, "All" vs specific tags)
   - Verify markets filter correctly by selected tag
   - Test horizontal scrolling on mobile devices
   - Verify mobile responsiveness and touch targets
   - Check design system token usage
   - Test edge cases (no tags available, network errors)

## Acceptance Criteria
- [ ] Users can see popular tags sorted by market volume in horizontal scrolling pills
- [ ] Users can select one tag at a time (single selection like Polymarket)
- [ ] "All" option allows clearing filter (no separate clear button needed)
- [ ] Markets filter in real-time based on selected tag
- [ ] Component follows design system patterns with mobile-first horizontal scrolling
- [ ] Touch-friendly design (minimum 44px touch targets)
- [ ] Smooth horizontal scrolling on mobile devices


## Notes
- Existing TagFilter component already uses design system tokens correctly
- Popular tags are sorted by market volume (implemented in tag-service.ts)
- New component uses single selection (like Polymarket) unlike existing TagFilter
- TagFilter already exists at correct location: `/shared/ui/popular-tag-filter.client.tsx`
- Mobile-first approach prioritizes horizontal scrolling and touch interactions
- Design mirrors Polymarket's clean pill-based tag selection UX

## File Changes Summary
- **Modified**: `/lib/trpc/schemas/market.ts` - Add tagIds parameter to GetTrendingMarketsInput
- **Modified**: `/lib/trpc/routers/markets.ts` - Add tag filtering logic to trending endpoint
- **Created**: `/shared/ui/popular-tag-list.client.tsx` - Mobile-first horizontal scrolling tag pills
- **Modified**: `/features/home/trending-markets.client.tsx` - Add state management & integrate component

## Estimated Time: 60 minutes total