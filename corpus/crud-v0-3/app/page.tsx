import { getProducts } from "@/app/actions/products"
import { ProductsManager } from "@/components/products-manager"

export default async function Page() {
  const products = await getProducts()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Product Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, and remove products in your catalog.
          </p>
        </header>

        <ProductsManager products={products} />
      </div>
    </main>
  )
}
