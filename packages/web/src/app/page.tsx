export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-sage-700 mb-6">
          Animal Protection Foundation
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Welcome to our mission of protecting and rescuing animals in need.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-muted p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold text-sage-600 mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              Dedicated to providing shelter, medical care, and loving homes for animals in crisis.
            </p>
          </div>
          
          <div className="bg-muted p-6 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold text-sage-600 mb-4">Get Involved</h2>
            <p className="text-muted-foreground">
              Join our community of supporters and help make a difference in animals&apos; lives.
            </p>
          </div>
        </div>

        {/* Demo of new color system */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-sage-700 mb-6">Design System Demo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Emergency Appeal Demo */}
            <div className="bg-emergency text-emergency-foreground p-4 rounded-lg">
              <h3 className="font-bold mb-2">Emergency Appeal</h3>
              <p className="text-sm">Urgent help needed for rescued animals</p>
            </div>
            
            {/* Donation CTA Demo */}
            <div className="bg-donate text-donate-foreground p-4 rounded-lg">
              <h3 className="font-bold mb-2">Donate Now</h3>
              <p className="text-sm">Support our mission with a contribution</p>
            </div>
            
            {/* Success Message Demo */}
            <div className="bg-success text-success-foreground p-4 rounded-lg">
              <h3 className="font-bold mb-2">Success Story</h3>
              <p className="text-sm">Another animal found their forever home</p>
            </div>
          </div>

          {/* Color Palette Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="space-y-2">
              <h4 className="font-semibold text-sage-700">Sage Colors</h4>
              <div className="bg-sage-100 p-2 rounded text-sage-900 text-xs">Light</div>
              <div className="bg-sage-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-sage-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-coral-700">Coral Colors</h4>
              <div className="bg-coral-100 p-2 rounded text-coral-900 text-xs">Light</div>
              <div className="bg-coral-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-coral-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-primary-700">Primary Colors</h4>
              <div className="bg-primary-100 p-2 rounded text-primary-900 text-xs">Light</div>
              <div className="bg-primary-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-primary-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Responsive Test</h4>
              <div className="bg-sage-500 p-2 rounded text-white text-xs xs:bg-coral-400 sm:bg-primary-500 md:bg-sage-600 lg:bg-coral-600">
                Responsive colors
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}