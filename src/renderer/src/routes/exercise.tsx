import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded'
import { Box, Button, Toolbar, Typography } from '@mui/material'
import { Onboarding$Exercise } from '@renderer/components/onboarding/exercise.onboarding'
import { StyledRouterLinkButton } from '@renderer/components/styled-router-link-button'
import { useSynthSoundEffects } from '@renderer/hooks/use-play-feedback-sfx'
import {
  clearPoseOverlay,
  closeCreatedWindow,
  drawPoseOverlay,
  getDownwardDogFeedback,
  getDownwardDogMetrics,
  getPlankFeedback,
  getPlankMetrics,
  getSquatFeedback,
  getSquatMetrics,
  getWebcamStream,
  Keypoint,
  openCreatedWindow,
  PoseFeedback,
  stopStream,
  syncOverlayCanvas
} from '@renderer/util/pose'
import { formatTimer } from '@renderer/util/timer'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast, type Id } from 'react-toastify'
import z from 'zod'

export const Route = createFileRoute('/exercise')({
  onError: () => {
    throw redirect({ to: '/' })
  },
  component: RouteComponent,
  validateSearch: z.object({
    videoSrc: z.string(),
    exerciseId: z.string()
  }),
  loader: async ({ abortController }) => {
    const stream = await getWebcamStream(abortController.signal)
    const onboardingHasRun = await window.persist.get('onboard-exercise-has-run', false)

    return {
      stream,
      onboardingHasRun
    }
  },
  onLeave: (match) => {
    stopStream(match.loaderData?.stream)
  }
})

function RouteComponent() {
  const { stream, onboardingHasRun } = Route.useLoaderData()
  const search = Route.useSearch()
  const { playGood, playBad } = useSynthSoundEffects()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const createdWindowIdRef = useRef<number | undefined>(undefined)
  const closedWindowRef = useRef(false)
  const feedbackToastIdRef = useRef<Id | null>(null)
  const feedbackCodeRef = useRef<string | null>(null)

  const [createdWindowId, setCreatedWindowId] = useState<number | undefined>(undefined)
  const [createdWindowOpen, setCreatedWindowOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerPaused, setTimerPaused] = useState(false)
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])

  const exerciseKind = useMemo(() => {
    const value = search.exerciseId.toLowerCase()

    if (value.includes('squat')) {
      return 'squat'
    }
    if (value.includes('downward-dog')) {
      return 'downward-dog'
    }
    return 'plank'
  }, [search.exerciseId])

  const squatMetrics = useMemo(() => {
    if (exerciseKind !== 'squat') {
      return null
    }

    return getSquatMetrics(keypoints)
  }, [exerciseKind, keypoints])

  const downwardDogMetrics = useMemo(() => {
    if (exerciseKind !== 'downward-dog') {
      return null
    }

    return getDownwardDogMetrics(keypoints)
  }, [exerciseKind, keypoints])

  const plankMetrics = useMemo(() => {
    if (exerciseKind !== 'plank') {
      return null
    }

    return getPlankMetrics(keypoints)
  }, [exerciseKind, keypoints])

  const feedback = useMemo<PoseFeedback>(() => {
    switch (exerciseKind) {
      case 'downward-dog':
        return getDownwardDogFeedback(keypoints, downwardDogMetrics)
      case 'squat':
        return getSquatFeedback(keypoints, squatMetrics)
      default:
        return getPlankFeedback(keypoints, plankMetrics)
    }
  }, [exerciseKind, keypoints, plankMetrics, squatMetrics, downwardDogMetrics])

  useEffect(() => {
    if (feedback.kind === 'good') {
      if (feedbackCodeRef.current !== null && feedbackCodeRef.current !== 'good') {
        void playGood()
      }

      feedbackCodeRef.current = 'good'
      if (feedbackToastIdRef.current !== null) {
        toast.update(feedbackToastIdRef.current, { type: 'success', render: 'Good!' })
      }
      return
    }

    if (feedbackToastIdRef.current === null || !toast.isActive(feedbackToastIdRef.current)) {
      feedbackToastIdRef.current = toast.warning(feedback.message, {
        toastId: 'feedback',
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        position: 'top-right'
      })

      feedbackCodeRef.current = feedback.code
      void playBad()

      return
    }

    if (feedbackCodeRef.current !== feedback.code) {
      toast.update(feedbackToastIdRef.current, {
        render: feedback.message,
        type: 'warning',
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        isLoading: false,
        position: 'top-right'
      })

      feedbackCodeRef.current = feedback.code
      void playBad()
    }
  }, [feedback, playBad, playGood])

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
    const canvas = canvasRef.current

    if (!video || !canvas) {
      return
    }

    const frameCanvas = document.createElement('canvas')
    const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true })

    frameCanvasRef.current = frameCanvas
    video.srcObject = stream

    let active = true
    let rafId = 0
    let runningInference = false

    const syncFrameCanvasSize = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return
      }

      if (frameCanvas.width !== video.videoWidth) {
        frameCanvas.width = video.videoWidth
      }

      if (frameCanvas.height !== video.videoHeight) {
        frameCanvas.height = video.videoHeight
      }

      syncOverlayCanvas(canvas)
    }

    const runFrame = async () => {
      if (!active || !frameCtx) {
        return
      }

      if (!video.videoWidth || !video.videoHeight) {
        return
      }

      syncFrameCanvasSize()

      frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height)

      const imageData = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height)

      const result = await window.windowApi.runPoseFrame({
        rgba: imageData.data,
        width: imageData.width,
        height: imageData.height
      })

      if (!active) {
        return
      }

      const nextKeypoints = Array.isArray(result) ? result : []

      setKeypoints(nextKeypoints)

      if (nextKeypoints.length > 0) {
        drawPoseOverlay(canvas, video, nextKeypoints)
      } else {
        clearPoseOverlay(canvas)
      }
    }

    const tick = async () => {
      if (!active) {
        return
      }

      if (!runningInference && video.readyState >= 2) {
        runningInference = true

        try {
          await runFrame()
        } finally {
          runningInference = false
        }
      }

      rafId = window.requestAnimationFrame(tick)
    }

    video.addEventListener('loadedmetadata', syncFrameCanvasSize)
    video.addEventListener('resize', syncFrameCanvasSize)
    window.addEventListener('resize', syncFrameCanvasSize)

    void video.play().then(() => {
      syncFrameCanvasSize()
      tick()
    })

    return () => {
      active = false
      window.cancelAnimationFrame(rafId)

      video.removeEventListener('loadedmetadata', syncFrameCanvasSize)
      video.removeEventListener('resize', syncFrameCanvasSize)
      window.removeEventListener('resize', syncFrameCanvasSize)

      clearPoseOverlay(canvas)

      video.pause()
      video.srcObject = null

      frameCanvasRef.current = null
      setKeypoints([])

      if (feedbackToastIdRef.current !== null) {
        toast.dismiss(feedbackToastIdRef.current)
        feedbackToastIdRef.current = null
      }

      feedbackCodeRef.current = null
    }
  }, [stream])

  useEffect(() => {
    let active = true

    const createWindowOnEnter = async () => {
      const createdWindow = await openCreatedWindow(search.videoSrc)

      if (!active) {
        closeCreatedWindow(createdWindow.id)
        return
      }

      closedWindowRef.current = false
      createdWindowIdRef.current = createdWindow.id
      setCreatedWindowId(createdWindow.id)
      setCreatedWindowOpen(true)
    }

    void createWindowOnEnter()

    return () => {
      active = false
    }
  }, [search.videoSrc])

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

      const result = await window.windowApi.windowExists(id)

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

  const [shouldRunOnboarding, setShouldRunOnboarding] = useState(!onboardingHasRun)

  useEffect(() => {
    const id = toast.info('Make sure that the room is well lit', {
      position: 'top-center',
      autoClose: false
    })
    return () => {
      toast.dismiss(id)
    }
  }, [])

  return (
    <>
      <Onboarding$Exercise
        shouldRun={shouldRunOnboarding}
        targets={{
          camera: '[data-tour="camera"]',
          timer: '[data-tour="timer"]',
          pauseTimerButton: '[data-tour="timer-btn"]',
          reopenReferenceVideoButton: '[data-tour="ref-btn"]'
        }}
        onFinished={() => {
          setShouldRunOnboarding(false)
          window.persist.set('onboard-exercise-has-run', true)
        }}
      />
      <Box
        sx={{
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          background: (t) => t.palette.primary.dark
        }}
      >
        <Box
          data-tour="camera"
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
        </Box>

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
            bgcolor: (t) => t.palette.primary.main,
            color: (t) => t.palette.primary.contrastText,
            boxShadow: 6
          }}
        >
          <Box component="span" data-tour="exercise-back-button">
            <StyledRouterLinkButton
              to="/"
              startIcon={<KeyboardArrowLeftRounded />}
              sx={{
                color: (t) => t.palette.primary.contrastText
              }}
            >
              {`Back`}
            </StyledRouterLinkButton>
          </Box>

          <Typography data-tour="timer" sx={{ minWidth: 56, textAlign: 'center' }}>
            {formatTimer(timerSeconds)}
          </Typography>

          <Button
            data-tour="timer-btn"
            onClick={() => {
              setTimerPaused((value) => !value)
            }}
            sx={{
              color: (t) => t.palette.primary.contrastText
            }}
          >
            {timerPaused ? `Resume` : `Pause`}
          </Button>

          <Button
            data-tour="ref-btn"
            disabled={createdWindowOpen}
            onClick={async () => {
              const createdWindow = await openCreatedWindow(search.videoSrc)
              closedWindowRef.current = false
              createdWindowIdRef.current = createdWindow.id
              setCreatedWindowId(createdWindow.id)
              setCreatedWindowOpen(true)
            }}
            sx={{
              color: (t) => t.palette.primary.contrastText
            }}
          >
            {`Reopen player`}
          </Button>
        </Toolbar>
      </Box>
    </>
  )
}
