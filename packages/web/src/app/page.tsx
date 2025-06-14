'use client'

import { ThemeSwitcher } from '@minniewinnie/ui/components'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header with Theme Switcher */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Animal Protection Foundation</h1>
            <p className="text-sm text-muted-foreground">Protecting animals with compassion</p>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Our Mission
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome to our mission of protecting and rescuing animals in need. 
            Use the theme switcher above to find the most comfortable viewing experience for you.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-muted p-6 rounded-lg border border-border">
            <h3 className="text-2xl font-semibold text-secondary mb-4">What We Do</h3>
            <p className="text-muted-foreground">
              Dedicated to providing shelter, medical care, and loving homes for animals in crisis.
            </p>
          </div>
          
          <div className="bg-muted p-6 rounded-lg border border-border">
            <h3 className="text-2xl font-semibold text-secondary mb-4">Get Involved</h3>
            <p className="text-muted-foreground">
              Join our community of supporters and help make a difference in animals&apos; lives.
            </p>
          </div>
        </div>

        {/* Theme Switching Demo */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">Theme Switching Demo</h2>
            <p className="text-muted-foreground mb-6">
              Try switching between themes using the controls above to see how our design adapts 
              to different accessibility needs and viewing preferences.
            </p>
          </div>
          
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
              <h4 className="font-semibold text-teal-700">Teal Colors</h4>
              <div className="bg-teal-100 p-2 rounded text-teal-900 text-xs">Light</div>
              <div className="bg-teal-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-teal-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-700">Orange Colors</h4>
              <div className="bg-orange-100 p-2 rounded text-orange-900 text-xs">Light</div>
              <div className="bg-orange-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-orange-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-700">Golden Colors</h4>
              <div className="bg-yellow-100 p-2 rounded text-yellow-900 text-xs">Light</div>
              <div className="bg-yellow-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-yellow-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-coral-700">Coral Colors</h4>
              <div className="bg-coral-100 p-2 rounded text-coral-900 text-xs">Light</div>
              <div className="bg-coral-500 p-2 rounded text-white text-xs">Medium</div>
              <div className="bg-coral-700 p-2 rounded text-white text-xs">Dark</div>
            </div>
          </div>

          {/* Animal Foundation Specific Colors */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Animal Foundation Specific</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-adoption-available text-success-foreground p-4 rounded-lg">
                <h4 className="font-bold mb-2">Available for Adoption</h4>
                <p className="text-sm">Ready to find their forever home</p>
              </div>
              
              <div className="bg-adoption-pending text-white p-4 rounded-lg">
                <h4 className="font-bold mb-2">Adoption Pending</h4>
                <p className="text-sm">Application being processed</p>
              </div>
              
              <div className="bg-adoption-adopted text-white p-4 rounded-lg">
                <h4 className="font-bold mb-2">Successfully Adopted</h4>
                <p className="text-sm">Happy in their new home</p>
              </div>
            </div>
          </div>

          {/* Responsive Breakpoint Test */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Responsive Breakpoints Test</h3>
            <div className="bg-teal-500 p-4 rounded text-white 
                            xs:bg-yellow-500 
                            sm:bg-orange-500 
                            md:bg-coral-500 
                            lg:bg-teal-600 
                            xl:bg-primary">
              This color changes at different breakpoints: xs/sm/md/lg/xl
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}