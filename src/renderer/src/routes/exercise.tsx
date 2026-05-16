import { KeyboardArrowLeftRounded } from '@mui/icons-material'
import { Box, Button, Toolbar, Typography } from '@mui/material'
import { StyledRouterLinkButton } from '@renderer/components/styled-router-link-button'
import { useSynthSoundEffects } from '@renderer/hooks/use-play-feedback-sfx'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

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

const openCreatedWindow = () =>
  window.api.createWindow({
    width: 800,
    height: 600,
    title: 'Media Player',
    x: 100,
    y: 100,
    url: 'https://www.youtube.com/embed/BPK9WNtpBgk'
  })

const closeCreatedWindow = (id?: number) => {
  if (id === undefined) {
    return
  }

  void window.api.deleteWindow(id)
}

const formatTimer = (seconds: number) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
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
    stopStream(match.loaderData?.stream)
  }
})

function RouteComponent() {
  const { stream } = Route.useLoaderData()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const createdWindowIdRef = useRef<number | undefined>(undefined)
  const closedWindowRef = useRef(false)
  const [createdWindowId, setCreatedWindowId] = useState<number | undefined>(undefined)
  const [createdWindowOpen, setCreatedWindowOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerPaused, setTimerPaused] = useState(false)
  const { playBad, playGood } = useSynthSoundEffects()

  useEffect(() => {
    createdWindowIdRef.current = createdWindowId
  }, [createdWindowId])

  useEffect(() => {
    if (timerPaused) {
      return
    }

    const intervalId = window.setInterval(() => {
      setTimerSeconds((value) => value + 1)
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [timerPaused])

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

  useEffect(() => {
    let active = true

    const createWindowOnEnter = async () => {
      const createdWindow = await openCreatedWindow()

      if (!active) {
        closeCreatedWindow(createdWindow.id)
        return
      }

      createdWindowIdRef.current = createdWindow.id
      setCreatedWindowId(createdWindow.id)
      setCreatedWindowOpen(true)
    }

    void createWindowOnEnter()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const syncCreatedWindowOpen = async () => {
      const id = createdWindowIdRef.current

      if (id === undefined) {
        if (active) {
          setCreatedWindowOpen(false)
        }

        return
      }

      const result = await window.api.windowExists(id)

      if (active) {
        setCreatedWindowOpen(result.exists)
      }
    }

    void syncCreatedWindowOpen()

    const intervalId = window.setInterval(() => {
      void syncCreatedWindowOpen()
    }, 1000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const closeWindowOnce = () => {
      if (closedWindowRef.current) {
        return
      }

      closedWindowRef.current = true
      closeCreatedWindow(createdWindowIdRef.current)
    }

    window.addEventListener('pagehide', closeWindowOnce)
    window.addEventListener('beforeunload', closeWindowOnce)

    return () => {
      window.removeEventListener('pagehide', closeWindowOnce)
      window.removeEventListener('beforeunload', closeWindowOnce)
      closeWindowOnce()
    }
  }, [])

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', position: 'relative', background: 'black' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: 'black'
        }}
      />

      <Toolbar
        disableGutters
        variant="dense"
        sx={{
          position: 'fixed',
          left: '50%',
          bottom: 16,
          transform: 'translateX(-50%)',
          zIndex: 10,
          gap: 1,
          px: 2,
          borderRadius: 999,
          bgcolor: 'background.paper',
          boxShadow: 6
        }}
      >
        <StyledRouterLinkButton to="/" startIcon={<KeyboardArrowLeftRounded />}>
          {`Back`}
        </StyledRouterLinkButton>

        <Typography sx={{ minWidth: 56, textAlign: 'center' }}>
          {formatTimer(timerSeconds)}
        </Typography>

        <Button
          onClick={() => {
            setTimerPaused((value) => !value)
          }}
        >
          {timerPaused ? `Resume` : `Pause`}
        </Button>

        {!createdWindowOpen && (
          <Button
            onClick={async () => {
              const createdWindow = await openCreatedWindow()

              closedWindowRef.current = false
              createdWindowIdRef.current = createdWindow.id
              setCreatedWindowId(createdWindow.id)
              setCreatedWindowOpen(true)
            }}
          >
            {`Reopen player`}
          </Button>
        )}

        {/* <Stack direction="row">
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
        </Stack> */}
      </Toolbar>
    </Box>
  )
}
