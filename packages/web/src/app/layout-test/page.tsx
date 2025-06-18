import { MainLayout } from '@/components/layout/MainLayout'

export default function LayoutTestPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Layout Component Testing</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This page is for developing and testing our new layout components.
        </p>
        
        <div className="space-y-8">
          {/* Test content to verify layout */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Testing Layout Structure</h2>
            <p className="mb-4">
              This content is wrapped in our new MainLayout component which includes
              the Header and Footer components.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Responsive Testing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Column 1</h3>
                <p className="text-sm text-muted-foreground">
                  Test content for responsive grid layout.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Column 2</h3>
                <p className="text-sm text-muted-foreground">
                  This should stack on mobile and display side by side on larger screens.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Column 3</h3>
                <p className="text-sm text-muted-foreground">
                  Testing three-column layout on large screens.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Long Content Test</h2>
            <p className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
              quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="mb-4">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
              eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p className="mb-4">
              This content helps us test that the footer stays at the bottom of the page
              and that the main content area has proper spacing.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}