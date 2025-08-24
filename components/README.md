# Components

This directory contains reusable React components for the BetterAI application.

## EventIcon

A reusable component for displaying event icons with proper fallback handling.

### Props

- `icon?: string | null` - The URL of the event icon image
- `title: string` - The event title (used for alt text and fallback)
- `size?: 'sm' | 'md' | 'lg'` - The size of the icon (default: 'md')
- `className?: string` - Additional CSS classes

### Features

- **Client-side image loading**: Images are loaded client-side from the URL stored in the database
- **Automatic fallback**: If the image fails to load or doesn't exist, shows the first letter of the event title
- **Smooth transitions**: Uses opacity transitions for smooth loading states
- **Multiple sizes**: Supports small (24px), medium (32px), and large (40px) sizes
- **Accessibility**: Proper alt text and semantic HTML

### Usage

```tsx
import { EventIcon } from '@/components/shared/event-icon'

// Basic usage
<EventIcon icon={event.icon} title={event.title} />

// With custom size
<EventIcon icon={event.icon} title={event.title} size="lg" />

// With additional classes
<EventIcon icon={event.icon} title={event.title} className="my-custom-class" />
```

### Implementation Details

The component handles several scenarios:

1. **No icon provided**: Shows fallback with first letter
2. **Icon URL provided but fails to load**: Automatically falls back to first letter
3. **Icon loads successfully**: Shows the image with smooth transition
4. **Loading state**: Shows fallback until image loads

The component uses React state to track loading and error states, ensuring a smooth user experience. 