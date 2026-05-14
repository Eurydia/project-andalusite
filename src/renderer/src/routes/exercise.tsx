import { Grid } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

function stopStream(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
}

async function getWebcamStream(signal: AbortSignal) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('navigator.mediaDevices.getUserMedia is not available')
  }

  if (signal.aborted) {
    throw new DOMException('Route load aborted', 'AbortError')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })

  if (signal.aborted) {
    stopStream(stream)
    throw new DOMException('Route load aborted', 'AbortError')
  }

  signal.addEventListener(
    'abort',
    () => {
      stopStream(stream)
    },
    { once: true }
  )

  return stream
}

export const Route = createFileRoute('/exercise')({
  loader: async ({ abortController }) => {
    const stream = await getWebcamStream(abortController.signal)
    return {
      stream
    }
  },

  onLeave: (match) => {
    const loaderData = match.loaderData
    stopStream(loaderData?.stream)
  },

  component: RouteComponent
})

function RouteComponent() {
  const { stream } = Route.useLoaderData()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    video.srcObject = stream

    return () => {
      video.srcObject = null
    }
  }, [stream])

  return (
    <Grid container>
      <Grid size={{ lg: 6 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            height: '100dvh',
            objectFit: 'contain',
            background: 'black'
          }}
        />
      </Grid>
    </Grid>
  )
}
