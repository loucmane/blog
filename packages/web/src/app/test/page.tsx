'use client'

import { useState } from 'react'
import { useTheme } from '@minniewinnie/ui/providers/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export default function TestPage()
{
  const { theme, setTheme } = useTheme()
  const [ dialogOpen, setDialogOpen ] = useState(false)
  const [ sheetOpen, setSheetOpen ] = useState(false)

  return (
    <div className="container mx-auto p-8">
      {/* Theme Switcher */ }
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Theme Switcher</CardTitle>
          <CardDescription>Test theme switching across all components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={ () => setTheme('light') }
              variant={ theme === 'light' ? 'default' : 'secondary' }
            >
              Light
            </Button>
            <Button
              onClick={ () => setTheme('dark') }
              variant={ theme === 'dark' ? 'default' : 'secondary' }
            >
              Dark
            </Button>
            <Button
              onClick={ () => setTheme('contrast') }
              variant={ theme === 'contrast' ? 'default' : 'secondary' }
            >
              High Contrast
            </Button>
            <Button
              onClick={ () => setTheme('gentle') }
              variant={ theme === 'gentle' ? 'default' : 'secondary' }
            >
              Gentle
            </Button>
          </div>
          <p className="mt-4 text-muted-foreground">Current theme: { theme }</p>
        </CardContent>
      </Card>

      {/* Component Testing Sections */ }
      <div className="space-y-8">
        {/* Typography Section */ }
        <section className="p-6 border rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Typography</h2>
          <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
          <h2 className="text-3xl font-semibold mb-2">Heading 2</h2>
          <h3 className="text-2xl font-medium mb-2">Heading 3</h3>
          <p className="text-base mb-2">Regular paragraph text with standard sizing.</p>
          <p className="text-sm text-muted-foreground mb-2">Small muted text for secondary information.</p>
          <p className="text-xs text-muted-foreground">Extra small text for fine print.</p>
        </section>

        {/* Colors Section */ }
        <section className="p-6 border rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-background border rounded"></div>
              <p className="text-sm">Background</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-foreground rounded"></div>
              <p className="text-sm">Foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded"></div>
              <p className="text-sm">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-secondary rounded"></div>
              <p className="text-sm">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-accent rounded"></div>
              <p className="text-sm">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-muted rounded"></div>
              <p className="text-sm">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-destructive rounded"></div>
              <p className="text-sm">Destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-border border rounded"></div>
              <p className="text-sm">Border</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */ }
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various button styles and states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button disabled>Disabled</Button>
              <Button className="w-full">Full Width</Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */ }
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Card components for content grouping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rescue Story</CardTitle>
                  <CardDescription>A heartwarming tale of recovery</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Luna, a gentle golden retriever, was found abandoned and malnourished.
                    After weeks of care and love, she&apos;s now thriving in her forever home.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">Read More</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Impact Metrics</CardTitle>
                  <CardDescription>Your donations at work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Animals Rescued</span>
                    <span className="font-bold">247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Medical Treatments</span>
                    <span className="font-bold">1,892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Forever Homes Found</span>
                    <span className="font-bold">203</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Forms Section */ }
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input components and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" placeholder="supporter@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="donation" className="text-sm font-medium">Donation Amount</label>
              <Input id="donation" type="number" placeholder="25" />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <Input id="message" placeholder="Share your thoughts..." />
            </div>
            <div className="space-y-2">
              <label htmlFor="disabled" className="text-sm font-medium">Disabled Input</label>
              <Input id="disabled" placeholder="This input is disabled" disabled />
            </div>
            <Button className="w-full">Submit Form</Button>
          </CardContent>
        </Card>

        {/* Dialogs & Sheets Section */ }
        <Card>
          <CardHeader>
            <CardTitle>Dialogs & Sheets</CardTitle>
            <CardDescription>Modal and slide-over components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Dialog open={ dialogOpen } onOpenChange={ setDialogOpen }>
                <DialogTrigger asChild>
                  <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Emergency Appeal</DialogTitle>
                    <DialogDescription>
                      Help us save Luna and other animals in need
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm">
                      We&apos;ve rescued 15 animals this week who urgently need medical care.
                      Your donation can make the difference between life and death.
                    </p>
                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-sm font-medium">
                        Donation Amount
                      </label>
                      <Input id="amount" placeholder="Enter amount" type="number" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={ () => setDialogOpen(false) }>
                      Maybe Later
                    </Button>
                    <Button onClick={ () => setDialogOpen(false) }>
                      Donate Now
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Sheet open={ sheetOpen } onOpenChange={ setSheetOpen }>
                <SheetTrigger asChild>
                  <Button variant="outline">Open Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>
                      Quick access to all sections
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start" onClick={ () => setSheetOpen(false) }>
                      Home
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={ () => setSheetOpen(false) }>
                      Rescue Stories
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={ () => setSheetOpen(false) }>
                      How to Help
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={ () => setSheetOpen(false) }>
                      About Us
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={ () => setSheetOpen(false) }>
                      Contact
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}