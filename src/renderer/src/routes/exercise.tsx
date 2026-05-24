import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded'
import { Box, Button, Toolbar, Typography, useTheme } from '@mui/material'
import { StyledRouterLinkButton } from '@renderer/components/styled-router-link-button'
import { useSynthSoundEffects } from '@renderer/hooks/use-play-feedback-sfx'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { toast, type Id } from 'react-toastify'
import z from 'zod'

type Keypoint = {
  x: number
  y: number
  score: number
}

type SquatMetrics = {
  leftKneeAngle: number
  rightKneeAngle: number
  averageKneeAngle: number
  stanceRatio: number
  squatStatus: 'Standing' | 'Good Squat' | 'Too Deep'
  stanceStatus: 'Normal' | 'Too Narrow' | 'Too Wide'
}

type PlankMetrics = {
  leftHipAngle: number
  rightHipAngle: number
  plankAngle: number
  plankStatus: 'Good Plank' | 'Hips Too Low' | 'Hips Too High'
}

type PoseFeedback =
  | {
      kind: 'good'
      code: 'good'
    }
  | {
      kind: 'bad'
      code: string
      message: string
    }

const POSE_TOAST_ID = 'pose-feedback-toast'
const POSE_PRIMARY_COLOR = '#FFA536'
const POSE_BACKGROUND_COLOR = '#fffdf5'

const COCO_SKELETON: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [5, 6],
  [5, 11],
  [6, 12],
  [11, 12],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16]
]

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

function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint) {
  const baX = a.x - b.x
  const baY = a.y - b.y
  const bcX = c.x - b.x
  const bcY = c.y - b.y

  const baLength = Math.hypot(baX, baY)
  const bcLength = Math.hypot(bcX, bcY)

  if (baLength === 0 || bcLength === 0) {
    return 0
  }

  const cosine = (baX * bcX + baY * bcY) / (baLength * bcLength)
  const clamped = Math.max(-1, Math.min(1, cosine))

  return (Math.acos(clamped) * 180) / Math.PI
}

function calculateDistance(a: Keypoint, b: Keypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getAverageScore(keypoints: Keypoint[]) {
  if (keypoints.length === 0) {
    return 0
  }

  return keypoints.reduce((total, point) => total + point.score, 0) / keypoints.length
}

function getSquatMetrics(keypoints: Keypoint[]): SquatMetrics | null {
  const leftShoulder = keypoints[5]
  const rightShoulder = keypoints[6]
  const leftHip = keypoints[11]
  const rightHip = keypoints[12]
  const leftKnee = keypoints[13]
  const rightKnee = keypoints[14]
  const leftAnkle = keypoints[15]
  const rightAnkle = keypoints[16]

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftKnee ||
    !rightKnee ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return null
  }

  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
  const averageKneeAngle = (leftKneeAngle + rightKneeAngle) / 2

  const shoulderWidth = calculateDistance(leftShoulder, rightShoulder)
  const ankleWidth = calculateDistance(leftAnkle, rightAnkle)
  const stanceRatio = shoulderWidth === 0 ? 0 : ankleWidth / shoulderWidth

  let squatStatus: SquatMetrics['squatStatus'] = 'Standing'

  if (averageKneeAngle < 130) {
    squatStatus = 'Good Squat'
  }

  if (averageKneeAngle < 80) {
    squatStatus = 'Too Deep'
  }

  let stanceStatus: SquatMetrics['stanceStatus'] = 'Normal'

  if (stanceRatio < 0.8) {
    stanceStatus = 'Too Narrow'
  } else if (stanceRatio > 1.5) {
    stanceStatus = 'Too Wide'
  }

  return {
    leftKneeAngle,
    rightKneeAngle,
    averageKneeAngle,
    stanceRatio,
    squatStatus,
    stanceStatus
  }
}

function getPlankMetrics(keypoints: Keypoint[]): PlankMetrics | null {
  const leftShoulder = keypoints[5]
  const rightShoulder = keypoints[6]
  const leftHip = keypoints[11]
  const rightHip = keypoints[12]
  const leftAnkle = keypoints[15]
  const rightAnkle = keypoints[16]

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
    return null
  }

  const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftAnkle)
  const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightAnkle)
  const plankAngle = (leftHipAngle + rightHipAngle) / 2

  let plankStatus: PlankMetrics['plankStatus'] = 'Good Plank'

  if (plankAngle < 165) {
    plankStatus = 'Hips Too Low'
  } else if (plankAngle > 190) {
    plankStatus = 'Hips Too High'
  }

  return {
    leftHipAngle,
    rightHipAngle,
    plankAngle,
    plankStatus
  }
}

function getSquatFeedback(keypoints: Keypoint[], metrics: SquatMetrics | null): PoseFeedback {
  if (keypoints.length === 0) {
    return {
      kind: 'bad',
      code: 'no-pose',
      message: 'Move into frame.'
    }
  }

  if (getAverageScore(keypoints) < 0.2) {
    return {
      kind: 'bad',
      code: 'low-confidence',
      message: 'Move closer to the camera.'
    }
  }

  if (!metrics) {
    return {
      kind: 'bad',
      code: 'squat-missing-body',
      message: 'Keep your full body visible.'
    }
  }

  if (metrics.stanceStatus === 'Too Narrow') {
    return {
      kind: 'bad',
      code: 'squat-stance-narrow',
      message: 'Widen your stance.'
    }
  }

  if (metrics.stanceStatus === 'Too Wide') {
    return {
      kind: 'bad',
      code: 'squat-stance-wide',
      message: 'Narrow your stance.'
    }
  }

  if (metrics.squatStatus === 'Too Deep') {
    return {
      kind: 'bad',
      code: 'squat-too-deep',
      message: 'Do not drop too low.'
    }
  }

  if (metrics.squatStatus === 'Standing') {
    return {
      kind: 'bad',
      code: 'squat-not-low-enough',
      message: 'Squat lower.'
    }
  }

  return {
    kind: 'good',
    code: 'good'
  }
}

function getPlankFeedback(keypoints: Keypoint[], metrics: PlankMetrics | null): PoseFeedback {
  if (keypoints.length === 0) {
    return {
      kind: 'bad',
      code: 'no-pose',
      message: 'Move into frame.'
    }
  }

  if (getAverageScore(keypoints) < 0.2) {
    return {
      kind: 'bad',
      code: 'low-confidence',
      message: 'Move closer to the camera.'
    }
  }

  if (!metrics) {
    return {
      kind: 'bad',
      code: 'plank-missing-body',
      message: 'Keep your shoulders, hips, and ankles visible.'
    }
  }

  if (metrics.plankStatus === 'Hips Too Low') {
    return {
      kind: 'bad',
      code: 'plank-hips-low',
      message: 'Lift your hips.'
    }
  }

  if (metrics.plankStatus === 'Hips Too High') {
    return {
      kind: 'bad',
      code: 'plank-hips-high',
      message: 'Lower your hips.'
    }
  }

  return {
    kind: 'good',
    code: 'good'
  }
}

function syncOverlayCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))

  if (canvas.width !== width) {
    canvas.width = width
  }

  if (canvas.height !== height) {
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  return {
    ctx,
    cssWidth: rect.width,
    cssHeight: rect.height
  }
}

function getContainedVideoRect(video: HTMLVideoElement, cssWidth: number, cssHeight: number) {
  const scale = Math.min(cssWidth / video.videoWidth, cssHeight / video.videoHeight)
  const width = video.videoWidth * scale
  const height = video.videoHeight * scale

  return {
    x: (cssWidth - width) / 2,
    y: (cssHeight - height) / 2,
    width,
    height,
    scale
  }
}

function drawPoseOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  keypoints: Keypoint[]
) {
  const synced = syncOverlayCanvas(canvas)

  if (!synced || !video.videoWidth || !video.videoHeight) {
    return
  }

  const { ctx, cssWidth, cssHeight } = synced
  const videoRect = getContainedVideoRect(video, cssWidth, cssHeight)

  ctx.clearRect(0, 0, cssWidth, cssHeight)

  const toOverlayPoint = (point: Keypoint) => ({
    x: videoRect.x + point.x * videoRect.scale,
    y: videoRect.y + point.y * videoRect.scale,
    score: point.score
  })

  ctx.lineWidth = 4
  ctx.strokeStyle = POSE_PRIMARY_COLOR
  ctx.fillStyle = POSE_PRIMARY_COLOR

  for (const [from, to] of COCO_SKELETON) {
    const a = keypoints[from]
    const b = keypoints[to]

    if (!a || !b) {
      continue
    }

    if (a.score < 0.2 || b.score < 0.2) {
      continue
    }

    const overlayA = toOverlayPoint(a)
    const overlayB = toOverlayPoint(b)

    ctx.beginPath()
    ctx.moveTo(overlayA.x, overlayA.y)
    ctx.lineTo(overlayB.x, overlayB.y)
    ctx.stroke()
  }

  for (const point of keypoints) {
    if (point.score < 0.2) {
      continue
    }

    const overlayPoint = toOverlayPoint(point)

    ctx.beginPath()
    ctx.arc(overlayPoint.x, overlayPoint.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = POSE_BACKGROUND_COLOR
    ctx.fill()

    ctx.beginPath()
    ctx.arc(overlayPoint.x, overlayPoint.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = POSE_PRIMARY_COLOR
    ctx.fill()
  }
}

function clearPoseOverlay(canvas: HTMLCanvasElement) {
  const synced = syncOverlayCanvas(canvas)

  if (!synced) {
    return
  }

  synced.ctx.clearRect(0, 0, synced.cssWidth, synced.cssHeight)
}

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
  const search = Route.useSearch()
  const t = useTheme()
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
  const [tourRun, setTourRun] = useState(false)
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])

  const exerciseKind = useMemo(() => {
    const value = search.exerciseId.toLowerCase()

    if (value.includes('squat')) {
      return 'squat'
    }

    if (value.includes('plank')) {
      return 'plank'
    }

    return 'plank'
  }, [search.exerciseId])

  const squatMetrics = useMemo(() => {
    if (exerciseKind !== 'squat') {
      return null
    }

    return getSquatMetrics(keypoints)
  }, [exerciseKind, keypoints])

  const plankMetrics = useMemo(() => {
    if (exerciseKind !== 'plank') {
      return null
    }

    return getPlankMetrics(keypoints)
  }, [exerciseKind, keypoints])

  const feedback = useMemo<PoseFeedback>(() => {
    if (exerciseKind === 'squat') {
      return getSquatFeedback(keypoints, squatMetrics)
    }

    return getPlankFeedback(keypoints, plankMetrics)
  }, [exerciseKind, keypoints, plankMetrics, squatMetrics])

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
    if (feedback.kind === 'good') {
      if (feedbackCodeRef.current !== null && feedbackCodeRef.current !== 'good') {
        void playGood()
      }

      feedbackCodeRef.current = 'good'

      if (feedbackToastIdRef.current !== null) {
        toast.dismiss(feedbackToastIdRef.current)
        feedbackToastIdRef.current = null
      }

      return
    }

    if (feedbackToastIdRef.current === null || !toast.isActive(feedbackToastIdRef.current)) {
      feedbackToastIdRef.current = toast.warning(feedback.message, {
        toastId: POSE_TOAST_ID,
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        pauseOnFocusLoss: false,
        pauseOnHover: false
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
        isLoading: false
      })

      feedbackCodeRef.current = feedback.code
      void playBad()
    }
  }, [feedback, playBad, playGood])

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

      const result = await window.api.runPoseFrame({
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

      <Box
        data-tour="exercise-camera-preview"
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'black'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'black'
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
