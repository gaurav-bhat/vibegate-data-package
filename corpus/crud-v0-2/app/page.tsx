import { getProducts } from "@/app/actions/products"
import { ProductsManager } from "@/components/products-manager"

export default async function Page() {
  const products = await getProducts()

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
            Product Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Manage your product catalog. Add, edit, and remove products.
          </p>
        </header>
        <ProductsManager products={products} />
      </div>
    </main>
  )
}
