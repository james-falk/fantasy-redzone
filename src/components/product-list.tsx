'use client'

import ProductCard from './product-card'

interface ProductListProps {
  products: Array<{
    id: string
    title: string
    shortDescription: string
    cover: string
    category: string
    publishDate: string
    source: 'youtube' | 'rss' | 'news' | 'static'
    url?: string
    sourceName?: string
    author?: string
    viewCount?: number
    duration?: string
    tags: string[]
  }>
  featuredContentIds: string[]
}

export default function ProductList({ products, featuredContentIds }: ProductListProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 redzone-card rounded-xl mx-4">
        <h3 className="text-xl font-semibold text-white mb-2">No content found</h3>
        <p className="text-gray-300">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          post={product}
          featured={featuredContentIds.includes(product.id)}
        />
      ))}
    </div>
  )
}
