export default function StoryLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="container mx-auto px-4 py-16">
      <p className="text-muted-foreground">Loading story…</p>
    </main>
  )
}
