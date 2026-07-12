import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeSwitcher } from '@minniewinnie/ui'
import Link from 'next/link'

export default function HomepageMockup() {
  return (
    <div className="min-h-screen">
      {/* Header with Theme Switcher */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Animal Protection Foundation</h1>
            <p className="text-sm text-muted-foreground">Mockup Design</p>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Stories of Hope.
            <br />
            <span className="text-primary">Actions that Matter.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Follow our journey rescuing and rehabilitating animals worldwide. Every story shared
            brings us closer to a more compassionate world.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/stories">Read Stories</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/donate">Support Our Work</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Impact Bar */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold">247</div>
              <div className="text-sm opacity-90">Animals Rescued This Year</div>
            </div>
            <div>
              <div className="text-4xl font-bold">1,892</div>
              <div className="text-sm opacity-90">Medical Treatments Provided</div>
            </div>
            <div>
              <div className="text-4xl font-bold">203</div>
              <div className="text-sm opacity-90">Forever Homes Found</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Stories */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Recent Stories from the Field
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Story Card 1 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted"></div>
              <CardHeader>
                <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                  <span>Rescue Story</span>
                  <span>•</span>
                  <span>5 min read</span>
                </div>
                <CardTitle>Luna&apos;s Journey: From Street to Safety</CardTitle>
                <CardDescription>
                  How a scared street dog learned to trust again and found her forever family
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0" asChild>
                  <Link href="/stories/luna">Read More →</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Story Card 2 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted"></div>
              <CardHeader>
                <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                  <span>Field Update</span>
                  <span>•</span>
                  <span>3 min read</span>
                </div>
                <CardTitle>Emergency Response: Flood Rescue Operations</CardTitle>
                <CardDescription>
                  Our team&apos;s rapid response saved 32 animals from rising floodwaters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0" asChild>
                  <Link href="/stories/flood-rescue">Read More →</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Story Card 3 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted"></div>
              <CardHeader>
                <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                  <span>Education</span>
                  <span>•</span>
                  <span>7 min read</span>
                </div>
                <CardTitle>Understanding Animal Body Language</CardTitle>
                <CardDescription>
                  Essential knowledge for anyone working with rescued animals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0" asChild>
                  <Link href="/stories/body-language">Read More →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link href="/stories">View All Stories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Connected</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get weekly updates from the field and learn how you can help make a difference
          </p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-2 rounded-md border bg-background"
            />
            <Button>Subscribe</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Ways to Help */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Ways You Can Help</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Donate</CardTitle>
                <CardDescription>
                  Your contribution directly funds rescue operations and medical care
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/donate">Make a Donation</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle>Foster</CardTitle>
                <CardDescription>
                  Provide temporary care for animals on their journey to forever homes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link href="/foster">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle>Share</CardTitle>
                <CardDescription>
                  Spread awareness by sharing our stories with your network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link href="/stories">Find Stories</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
