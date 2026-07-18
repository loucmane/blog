'use client'

import { useId, useState } from 'react'

import type { MediaAsset } from '@/server/content/domain'

interface MediaLibraryProps {
  readonly disabled?: boolean
  readonly media: readonly MediaAsset[]
  readonly onAdded: (asset: MediaAsset) => void
}

export function MediaLibrary({ disabled = false, media, onAdded }: MediaLibraryProps) {
  const fileId = useId()
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  async function upload(form: HTMLFormElement) {
    setUploading(true)
    setMessage('Uploading and checking the original image…')
    try {
      const response = await fetch('/api/owner/media', {
        body: new FormData(form),
        method: 'POST',
      })
      const result = (await response.json()) as { asset?: MediaAsset; error?: string }
      if (!response.ok || !result.asset) throw new Error(result.error ?? 'The upload failed.')
      onAdded(result.asset)
      form.reset()
      setMessage('Image added. It is ready to insert into the story.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section
      aria-labelledby="media-library-title"
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-xl font-semibold" id="media-library-title">
        Media library
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alt text and credit are required so every image is accessible and attributable.
      </p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void upload(event.currentTarget)
        }}
      >
        <label className="grid gap-1 text-sm" htmlFor={fileId}>
          Image file
          <input
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className="min-h-11 rounded-md border border-input bg-background p-2"
            disabled={disabled}
            id={fileId}
            name="file"
            required
            type="file"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Description for people who cannot see the image
          <input
            className="min-h-11 rounded-md border border-input bg-background px-3"
            disabled={disabled}
            name="alt"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          Caption (optional)
          <textarea
            className="min-h-20 rounded-md border border-input bg-background p-3"
            disabled={disabled}
            name="caption"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Credit
          <input
            className="min-h-11 rounded-md border border-input bg-background px-3"
            disabled={disabled}
            name="creditName"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          Credit link (optional)
          <input
            className="min-h-11 rounded-md border border-input bg-background px-3"
            disabled={disabled}
            name="creditUrl"
            type="url"
          />
        </label>
        <button
          className="min-h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
          disabled={disabled || uploading}
          type="submit"
        >
          {uploading ? 'Uploading…' : 'Add image'}
        </button>
      </form>
      <p aria-live="polite" className="mt-3 text-sm" role="status">
        {message}
      </p>
      {media.length > 0 ? (
        <ul className="mt-4 grid gap-2 text-sm">
          {media.map((asset) => (
            <li className="rounded-md bg-muted p-3" key={asset.id}>
              <strong>{asset.alt}</strong>
              <span className="block text-muted-foreground">Credit: {asset.creditName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No images yet.</p>
      )}
    </section>
  )
}
