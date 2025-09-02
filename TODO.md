# Popular Tags Filter Implementation Plan

## Task Overview
Add Popular Tags Filter functionality to trending markets page by completing missing pieces in existing infrastructure.

## Context
-  Database schema complete (Tag, EventTag models)
-  Service layer complete (tag-service.ts with volume-based sorting)
-  tRPC router complete (tags.getPopular endpoint)
-  Base component exists (TagFilter in /components/ - will be moved)

*** Wes to update plan - tag filter is no longer in components



- L Missing PopularTagsList component for multiple selection
- L Missing state management in trending-markets.client.tsx
- L Missing tag filtering in markets.trending endpoint

## Implementation Tasks

### Phase 1: Backend - Add Tag Filtering Support (15 mins)
1. **Update markets.trending endpoint**
   - Add `tagIds?: string[]` parameter to GetMarketsInput schema in `/lib/trpc/schemas/market.ts`
   - Add tag filtering logic to trending markets query in `/lib/trpc/routers/markets.ts`
   - Filter markets where `event.eventTags.some(et => tagIds.includes(et.tagId))`
   - Test endpoint returns filtered results

### Phase 2: Component Migration & Creation (15 mins)
2. **Move TagFilter and create PopularTagsList**
   - Move `/components/tag-filter.tsx` � `/shared/ui/TagFilter.tsx`
   - Update import in `/features/leaderboard/LeaderboardWrapper.client.tsx` to use new path
   - Copy `/shared/ui/TagFilter.tsx` � `/shared/ui/PopularTagsList.tsx`
   - Update PopularTagsList to support multiple selection:
     - Rename component `TagFilter` � `PopularTagsList`
     - Update props interface:
       ```typescript
       interface PopularTagsListProps {
         tags: Array<Tag & { totalVolume?: number }>
         selectedTagIds: string[]
         onTagSelect: (tagId: string) => void
         onClearFilters: () => void
         isFiltered: boolean
       }
       ```
     - Update selection logic for multiple tags (toggle behavior)
     - Update styling to show multiple selected states
   - Ensure design system alignment maintained

### Phase 3: State Management (10 mins)
3. **Add state management to trending-markets.client.tsx**
   - Add missing state variables:
     ```typescript
     const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
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
   - Add tag selection handlers:
     ```typescript
     const handleTagSelect = (tagId: string) => {
       setSelectedTagIds(prev => 
         prev.includes(tagId) 
           ? prev.filter(id => id !== tagId)
           : [...prev, tagId]
       )
     }
     const handleClearFilters = () => setSelectedTagIds([])
     ```

### Phase 4: Integration (10 mins)
4. **Integrate tag filtering with markets query**
   - Update `trpc.markets.trending.useQuery` to include `tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined`
   - Import `PopularTagsList` component from `/shared/ui/PopularTagsList`
   - Uncomment the Popular Tags Filter section in trending-markets.client.tsx
   - Update the commented code to use correct component and props:
     ```tsx
     {!tagsLoading && popularTags.length > 0 && (
       <div className="flex justify-center">
         <div className="w-full max-w-4xl">
           <PopularTagsList 
             tags={popularTags} 
             selectedTagIds={selectedTagIds}
             onTagSelect={handleTagSelect}
             onClearFilters={handleClearFilters}
             isFiltered={selectedTagIds.length > 0}
           />
         </div>
       </div>
     )}
     ```

### Phase 5: Testing & Polish (10 mins)
5. **Test and verify functionality**
   - Test tag selection/deselection (multiple tags)
   - Verify markets filter correctly by selected tags
   - Test clear filters functionality
   - Verify mobile responsiveness
   - Check design system token usage
   - Ensure leaderboard TagFilter still works after move
   - Test edge cases (no tags selected, all tags selected)

## Acceptance Criteria
- [ ] Users can see popular tags sorted by market volume
- [ ] Users can select/deselect multiple tags simultaneously  
- [ ] Markets filter in real-time based on selected tags
- [ ] "Clear filters" functionality works
- [ ] Component follows design system patterns (card, button variants, spacing)
- [ ] Mobile-friendly responsive design
- [ ] No breaking changes to existing leaderboard functionality
- [ ] TagFilter component successfully moved from /components/ to /shared/ui/

## Notes
- Existing TagFilter component already uses design system tokens correctly
- Popular tags are sorted by market volume (implemented in tag-service.ts)
- New component supports multiple selection unlike existing single-select TagFilter
- Following project guidance: moved away from `/components/` folder to `/shared/ui/`
- Only TagFilter has single dependency - safe to move
- Other /components/ files deferred due to multiple dependencies

## File Changes Summary
- **Modified**: `/lib/trpc/schemas/market.ts` - Add tagIds parameter
- **Modified**: `/lib/trpc/routers/markets.ts` - Add tag filtering logic
- **Moved**: `/components/tag-filter.tsx` � `/shared/ui/TagFilter.tsx`
- **Created**: `/shared/ui/PopularTagsList.tsx` - Multiple selection variant
- **Modified**: `/features/leaderboard/LeaderboardWrapper.client.tsx` - Update import path
- **Modified**: `/features/home/trending-markets.client.tsx` - Add state & uncomment UI

## Estimated Time: 60 minutes total