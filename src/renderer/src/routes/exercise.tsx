import { KeyboardArrowLeftRounded } from '@mui/icons-material'
import { Button, Grid, Stack, Toolbar } from '@mui/material'
import { StyledRouterLinkButton } from '@renderer/components/styled-router-link-button'
import { useSynthSoundEffects } from '@renderer/hooks/use-play-feedback-sfx'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import ReactPlayer from 'react-player'
import { toast } from 'react-toastify'

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
  component: RouteComponent,
  loader: async ({ abortController }) => {
    const stream = await getWebcamStream(abortController.signal)
    return {
      stream
    }
  },
  onLeave: (match) => {
    const loaderData = match.loaderData
    stopStream(loaderData?.stream)
  }
})

function RouteComponent() {
  const { stream } = Route.useLoaderData()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const { playBad, playGood } = useSynthSoundEffects()
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
    <Stack>
      <Toolbar disableGutters variant="dense" sx={{ justifyContent: 'space-between' }}>
        <StyledRouterLinkButton to="/" startIcon={<KeyboardArrowLeftRounded />}>
          {`Back`}
        </StyledRouterLinkButton>
      </Toolbar>
      <Grid container sx={{ height: 'fit-content' }}>
        <Grid size={{ lg: 6 }}>
          <ReactPlayer
            controls
            loop
            height={'100%'}
            width={'100%'}
            src={'https://www.youtube.com/embed/BPK9WNtpBgk'}
          />
        </Grid>
        <Grid
          size={{ lg: 6 }}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              objectFit: 'cover',
              background: 'black'
            }}
          />
        </Grid>
      </Grid>
      <Toolbar>
        <Button
          onClick={() => {
            toast.success('Nice form!')
            playGood()
          }}
        >
          {`Test okay feedback`}
        </Button>
        <Button
          onClick={() => {
            toast.warn('Bad form!')
            playBad()
          }}
        >
          {`Test warning feedback`}
        </Button>
      </Toolbar>
    </Stack>
  )
}
