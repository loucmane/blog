export function PreviewStoryLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div
        className="container mx-auto max-w-4xl rounded-lg border border-secondary bg-muted p-6"
        data-preview-stream-fallback
        role="status"
      >
        <p className="font-semibold">Preparing private preview…</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifying this draft link before displaying unpublished content.
        </p>
      </div>
    </main>
  )
}
