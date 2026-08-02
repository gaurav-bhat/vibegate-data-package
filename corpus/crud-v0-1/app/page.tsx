import { getProducts } from "@/app/actions/products"
import { ProductManager } from "@/components/product-manager"

export default async function Page() {
  const products = await getProducts()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Product Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Manage your product catalog. Add, edit, and remove products stored in your database.
          </p>
        </header>

        <ProductManager products={products} />
      </div>
    </main>
  )
}
