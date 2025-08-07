import ProductCard from './product-card'
import { Content } from '@/types/content'

interface ProductListProps {
  products: Content[]
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  return (
    <div className="grid gap-x-14 gap-y-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} post={product} />
      ))}
    </div>
  )
}

export default ProductList
