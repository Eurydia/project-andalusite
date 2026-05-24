import { KeyboardArrowLeftRounded } from '@mui/icons-material'
import { Box, Button, Toolbar, Typography, useTheme } from '@mui/material'
import { StyledRouterLinkButton } from '@renderer/components/styled-router-link-button'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import z from 'zod'

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

const openCreatedWindow = (url: string) =>
  window.api.createWindow({
    width: 800,
    height: 600,
    title: 'Media Player',
    x: 100,
    y: 100,
    url
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
  onError: () => {
    throw redirect({ to: '/' })
  },
  component: RouteComponent,
  validateSearch: z.object({
    videoSrc: z.url(),
    exerciseId: z.string()
  }),
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
  const [tourRun, setTourRun] = useState(false)
  // const { playBad, playGood } = useSynthSoundEffects()
  const t = useTheme()

  const tourSteps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="exercise-camera-preview"]',
        content: 'This is your live camera view for the exercise.',
        placement: 'center',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-timer"]',
        content: 'This timer tracks how long the current exercise session has been running.',
        placement: 'top',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-pause-button"]',
        content: 'Use this button to pause or resume the session timer.',
        placement: 'top',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-video-player"]',
        content:
          'The reference exercise video opens in a separate player window. Reopen it here if it was closed.',
        placement: 'top',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-back-button"]',
        content: 'Return to the exercise list from here.',
        placement: 'top',
        skipBeacon: true
      }
    ],
    []
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setTourRun(true)
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [])

  function handleTourEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setTourRun(false)
    }
  }

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

  const search = Route.useSearch()

  useEffect(() => {
    let active = true

    const createWindowOnEnter = async () => {
      const createdWindow = await openCreatedWindow(search.videoSrc)

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
      <Joyride
        run={tourRun}
        continuous
        steps={tourSteps}
        onEvent={handleTourEvent}
        options={{
          zIndex: t.zIndex.modal + 1,
          skipBeacon: true,
          showProgress: true,
          spotlightPadding: 12,
          backgroundColor: '#111111',
          textColor: '#ffffff',
          primaryColor: '#ffffff',
          arrowColor: '#111111',
          overlayColor: 'rgba(0, 0, 0, 0.48)'
        }}
      />

      <video
        ref={videoRef}
        data-tour="exercise-camera-preview"
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
        <Box component="span" data-tour="exercise-back-button">
          <StyledRouterLinkButton to="/" startIcon={<KeyboardArrowLeftRounded />}>
            {`Back`}
          </StyledRouterLinkButton>
        </Box>

        <Typography data-tour="exercise-timer" sx={{ minWidth: 56, textAlign: 'center' }}>
          {formatTimer(timerSeconds)}
        </Typography>

        <Button
          data-tour="exercise-pause-button"
          onClick={() => {
            setTimerPaused((value) => !value)
          }}
        >
          {timerPaused ? `Resume` : `Pause`}
        </Button>

        <Box component="span" data-tour="exercise-video-player">
          {createdWindowOpen ? (
            <Typography sx={{ px: 1 }}>{`Player open`}</Typography>
          ) : (
            <Button
              onClick={async () => {
                const createdWindow = await openCreatedWindow(search.videoSrc)

                closedWindowRef.current = false
                createdWindowIdRef.current = createdWindow.id
                setCreatedWindowId(createdWindow.id)
                setCreatedWindowOpen(true)
              }}
            >
              {`Reopen player`}
            </Button>
          )}
        </Box>
      </Toolbar>
    </Box>
  )
}
