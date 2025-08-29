# Popular Tags Filter Implementation Plan

## Task Overview
Add Popular Tags Filter functionality to trending markets page by completing missing pieces in existing infrastructure.

## Context
- ✅ Database schema complete (Tag, EventTag models)
- ✅ Service layer complete (tag-service.ts with volume-based sorting)
- ✅ tRPC router complete (tags.getPopular endpoint)
- ✅ Base component exists (TagFilter in /components/)
- ❌ Missing PopularTagsList component
- ❌ Missing state management in trending-markets.client.tsx
- ❌ Missing tag filtering in markets.trending endpoint

## Implementation Tasks

### Phase 1: Backend - Add Tag Filtering Support (15 mins)
1. **Update markets.trending endpoint**
   - Add `tagIds` parameter to GetMarketsInput schema in `/lib/trpc/schemas/market.ts`
   - Add tag filtering logic to trending markets query in `/lib/trpc/routers/markets.ts`
   - Test endpoint returns filtered results

### Phase 2: Component Creation (10 mins)
2. **Create PopularTagsList component**
   - Copy `/components/tag-filter.tsx` to `/features/home/PopularTagsList.client.tsx`
   - Rename `TagFilter` → `PopularTagsList`
   - Update props interface to support:
     - `tags: Tag[]` (array of popular tags)
     - `selectedTagIds: string[]` (multiple selection)
     - `onTagSelect: (tagId: string) => void`
     - `onClearFilters: () => void`
     - `isFiltered: boolean`
   - Update component to handle multiple tag selection instead of single
   - Ensure design system alignment maintained

### Phase 3: State Management (5 mins)
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
     } = trpc.tags.getPopular.useQuery({ limit: 8 })
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

### Phase 4: Integration (5 mins)
4. **Integrate tag filtering with markets query**
   - Update `trpc.markets.trending.useQuery` to include `tagIds: selectedTagIds`
   - Import `PopularTagsList` component
   - Uncomment the Popular Tags Filter section in trending-markets.client.tsx
   - Update the commented code to use correct component and props

### Phase 5: Testing & Polish (5 mins)
5. **Test and verify functionality**
   - Test tag selection/deselection
   - Verify markets filter correctly by selected tags
   - Test clear filters functionality
   - Verify mobile responsiveness
   - Check design system token usage

## Acceptance Criteria
- [ ] Users can see popular tags by market volume
- [ ] Users can select/deselect multiple tags
- [ ] Markets filter in real-time based on selected tags
- [ ] "Clear filters" functionality works
- [ ] Component follows design system patterns
- [ ] Mobile-friendly responsive design
- [ ] No breaking changes to existing functionality

## Notes
- Existing TagFilter component already uses design system tokens correctly
- Popular tags are sorted by market volume (implemented in tag-service.ts)
- Component should support multiple selection unlike existing single-select TagFilter
- Maintain consistency with existing tag filtering patterns in the app

## Estimated Time: 30-40 minutes total