import { KeyboardArrowLeftRounded } from '@mui/icons-material'
import { Box, Button, Toolbar, Typography, useTheme } from '@mui/material'
import { StyledRouterLinkButton } from '@renderer/components/styled-router-link-button'
import { createFileRoute, redirect } from '@tanstack/react-router'
import * as ort from 'onnxruntime-web/wasm'
import { useEffect, useMemo, useRef, useState } from 'react'
import { STATUS, type EventData, type Step } from 'react-joyride'
import z from 'zod'

type Keypoint = {
  x: number
  y: number
  score: number
}

type PoseResult = {
  keypoints: Keypoint[]
}

type Letterbox = {
  scale: number
  padX: number
  padY: number
  sourceWidth: number
  sourceHeight: number
}

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

class YoloPoseOnnxRunner {
  private session?: ort.InferenceSession

  constructor(
    private readonly options: {
      modelUrl?: string
      inputSize?: number
      confidenceThreshold?: number
      keypointThreshold?: number
    } = {}
  ) {}

  async load() {
    if (this.session) {
      return
    }

    this.session = await ort.InferenceSession.create(
      this.options.modelUrl ?? '/models/yolo26n-pose.onnx',
      {
        executionProviders: ['wasm']
      }
    )
  }

  async runVideoFrame(video: HTMLVideoElement): Promise<PoseResult | null> {
    await this.load()

    if (!this.session) {
      return null
    }

    if (!video.videoWidth || !video.videoHeight) {
      return null
    }

    const { tensor, letterbox } = this.preprocess(video)

    const inputName = this.session.inputNames[0]
    const outputName = this.session.outputNames[0]

    const outputs = await this.session.run({
      [inputName]: tensor
    })

    const output = outputs[outputName]
    const keypoints = this.parseBestPose(output, letterbox)

    if (!keypoints) {
      return null
    }

    return {
      keypoints
    }
  }

  private preprocess(video: HTMLVideoElement) {
    const inputSize = this.options.inputSize ?? 640

    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight

    const scale = Math.min(inputSize / sourceWidth, inputSize / sourceHeight)
    const resizedWidth = Math.round(sourceWidth * scale)
    const resizedHeight = Math.round(sourceHeight * scale)

    const padX = Math.floor((inputSize - resizedWidth) / 2)
    const padY = Math.floor((inputSize - resizedHeight) / 2)

    const canvas = document.createElement('canvas')
    canvas.width = inputSize
    canvas.height = inputSize

    const ctx = canvas.getContext('2d', {
      willReadFrequently: true
    })

    if (!ctx) {
      throw new Error('Could not create preprocessing canvas context')
    }

    ctx.fillStyle = 'rgb(114, 114, 114)'
    ctx.fillRect(0, 0, inputSize, inputSize)

    ctx.drawImage(video, 0, 0, sourceWidth, sourceHeight, padX, padY, resizedWidth, resizedHeight)

    const imageData = ctx.getImageData(0, 0, inputSize, inputSize).data
    const pixels = inputSize * inputSize
    const input = new Float32Array(3 * pixels)

    for (let i = 0; i < pixels; i++) {
      const rgbaIndex = i * 4

      input[i] = imageData[rgbaIndex] / 255
      input[pixels + i] = imageData[rgbaIndex + 1] / 255
      input[pixels * 2 + i] = imageData[rgbaIndex + 2] / 255
    }

    return {
      tensor: new ort.Tensor('float32', input, [1, 3, inputSize, inputSize]),
      letterbox: {
        scale,
        padX,
        padY,
        sourceWidth,
        sourceHeight
      } satisfies Letterbox
    }
  }

  private parseBestPose(output: ort.Tensor, letterbox: Letterbox): Keypoint[] | null {
    const data = output.data as Float32Array
    const dims = output.dims

    if (dims.length !== 3) {
      throw new Error(`Unsupported YOLO output shape: ${dims.join('x')}`)
    }

    const dim1 = dims[1]
    const dim2 = dims[2]

    const channelsFirst = dim1 < dim2
    const itemSize = channelsFirst ? dim1 : dim2
    const candidateCount = channelsFirst ? dim2 : dim1

    if (itemSize < 56) {
      throw new Error(`Expected YOLO pose item size >= 56, got ${itemSize}`)
    }

    const get = (candidateIndex: number, valueIndex: number) => {
      if (channelsFirst) {
        return data[valueIndex * candidateCount + candidateIndex]
      }

      return data[candidateIndex * itemSize + valueIndex]
    }

    const confidenceThreshold = this.options.confidenceThreshold ?? 0.25

    let bestScore = -Infinity
    let bestKeypoints: Keypoint[] | null = null

    for (let i = 0; i < candidateCount; i++) {
      const boxScore = get(i, 4)

      if (boxScore < confidenceThreshold) {
        continue
      }

      if (boxScore <= bestScore) {
        continue
      }

      const keypoints: Keypoint[] = []

      for (let k = 0; k < 17; k++) {
        const base = 5 + k * 3

        const modelX = get(i, base)
        const modelY = get(i, base + 1)
        const score = get(i, base + 2)

        const x = (modelX - letterbox.padX) / letterbox.scale
        const y = (modelY - letterbox.padY) / letterbox.scale

        keypoints.push({
          x: Math.max(0, Math.min(letterbox.sourceWidth, x)),
          y: Math.max(0, Math.min(letterbox.sourceHeight, y)),
          score
        })
      }

      bestScore = boxScore
      bestKeypoints = keypoints
    }

    return bestKeypoints
  }
}

function drawPoseOverlay(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.lineWidth = 4
  ctx.strokeStyle = '#00e676'
  ctx.fillStyle = '#ff1744'

  for (const [from, to] of COCO_SKELETON) {
    const a = keypoints[from]
    const b = keypoints[to]

    if (!a || !b) {
      continue
    }

    if (a.score < 0.2 || b.score < 0.2) {
      continue
    }

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  for (const point of keypoints) {
    if (point.score < 0.2) {
      continue
    }

    ctx.beginPath()
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
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
  const search = Route.useSearch()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const runnerRef = useRef<YoloPoseOnnxRunner | null>(null)

  const createdWindowIdRef = useRef<number | undefined>(undefined)
  const closedWindowRef = useRef(false)

  const [createdWindowId, setCreatedWindowId] = useState<number | undefined>(undefined)
  const [createdWindowOpen, setCreatedWindowOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerPaused, setTimerPaused] = useState(false)
  const [tourRun, setTourRun] = useState(false)
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null)

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
    const canvas = canvasRef.current

    if (!video || !canvas) {
      return
    }

    let disposed = false
    let rafId = 0
    let runningInference = false

    video.srcObject = stream

    const syncCanvasSize = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return
      }

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth
      }

      if (canvas.height !== video.videoHeight) {
        canvas.height = video.videoHeight
      }
    }

    const start = async () => {
      runnerRef.current = new YoloPoseOnnxRunner({
        modelUrl: '/models/yolo26n-pose.onnx',
        inputSize: 640,
        confidenceThreshold: 0.25,
        keypointThreshold: 0.2
      })

      await runnerRef.current.load()

      if (disposed) {
        return
      }

      await video.play()
      syncCanvasSize()

      const ctx = canvas.getContext('2d')

      if (!ctx) {
        return
      }

      const tick = async () => {
        if (disposed) {
          return
        }

        syncCanvasSize()

        if (!runningInference && runnerRef.current && video.readyState >= 2) {
          runningInference = true

          try {
            const result = await runnerRef.current.runVideoFrame(video)

            if (result) {
              setPoseResult(result)
              drawPoseOverlay(ctx, result.keypoints)
            } else {
              setPoseResult(null)
              ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
          } finally {
            runningInference = false
          }
        }

        rafId = requestAnimationFrame(tick)
      }

      tick()
    }

    video.addEventListener('loadedmetadata', syncCanvasSize)
    video.addEventListener('resize', syncCanvasSize)

    void start()

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)

      video.removeEventListener('loadedmetadata', syncCanvasSize)
      video.removeEventListener('resize', syncCanvasSize)

      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)

      video.pause()
      video.srcObject = null
      setPoseResult(null)
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
      {/* <Joyride
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
      /> */}

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
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 10,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: 'rgba(0, 0, 0, 0.72)',
          color: 'white'
        }}
      >
        <Typography variant="body2">{`Keypoints: ${poseResult?.keypoints.length ?? 0}`}</Typography>
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
