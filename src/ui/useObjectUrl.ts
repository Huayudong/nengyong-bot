import { useEffect, useState } from 'react'

/** A blob: URL for showing a local file (a picked image, say), released when the file changes or the caller unmounts. */
export function useObjectUrl(blob: Blob): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const created = URL.createObjectURL(blob)
    setUrl(created)
    return () => URL.revokeObjectURL(created)
  }, [blob])
  return url
}
