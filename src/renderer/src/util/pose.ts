import { theme } from '@renderer/theme'

const POSE_PRIMARY_COLOR = theme.palette.primary.dark
const POSE_BACKGROUND_COLOR = theme.palette.primary.main

export type Keypoint = {
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

type DownwardDogMetrics = {
  leftHipAngle: number
  rightHipAngle: number
  hipAngle: number
  leftArmAngle: number
  rightArmAngle: number
  armAngle: number
  leftLegAngle: number
  rightLegAngle: number
  legAngle: number
  downwardDogStatus:
    | 'Good Downward Dog'
    | 'Hips Too Low'
    | 'Too Folded'
    | 'Bend Arms'
    | 'Bend Knees'
}

export type PoseFeedback =
  | {
      kind: 'good'
      code: 'good'
    }
  | {
      kind: 'bad'
      code: string
      message: string
    }

export const COCO_SKELETON: Array<[number, number]> = [
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

export function stopStream(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
}

export async function getWebcamStream(signal: AbortSignal) {
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

export const openCreatedWindow = (url: string) =>
  window.windowApi.createWindow({
    width: 800,
    height: 600,
    title: 'Media Player',
    x: 100,
    y: 100,
    url
  })

export const closeCreatedWindow = (id?: number) => {
  if (id === undefined) {
    return
  }

  void window.windowApi.deleteWindow(id)
}

export function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint) {
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

export function calculateDistance(a: Keypoint, b: Keypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getAverageScore(keypoints: Keypoint[]) {
  if (keypoints.length === 0) {
    return 0
  }

  return keypoints.reduce((total, point) => total + point.score, 0) / keypoints.length
}

export function getDownwardDogMetrics(keypoints: Keypoint[]): DownwardDogMetrics | null {
  const leftShoulder = keypoints[5]
  const rightShoulder = keypoints[6]
  const leftElbow = keypoints[7]
  const rightElbow = keypoints[8]
  const leftWrist = keypoints[9]
  const rightWrist = keypoints[10]
  const leftHip = keypoints[11]
  const rightHip = keypoints[12]
  const leftKnee = keypoints[13]
  const rightKnee = keypoints[14]
  const leftAnkle = keypoints[15]
  const rightAnkle = keypoints[16]

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftElbow ||
    !rightElbow ||
    !leftWrist ||
    !rightWrist ||
    !leftHip ||
    !rightHip ||
    !leftKnee ||
    !rightKnee ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return null
  }

  const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftAnkle)
  const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightAnkle)
  const hipAngle = (leftHipAngle + rightHipAngle) / 2

  const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
  const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
  const armAngle = (leftArmAngle + rightArmAngle) / 2

  const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
  const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
  const legAngle = (leftLegAngle + rightLegAngle) / 2

  let downwardDogStatus: DownwardDogMetrics['downwardDogStatus'] = 'Good Downward Dog'

  if (hipAngle > 130) {
    downwardDogStatus = 'Hips Too Low'
  } else if (hipAngle < 80) {
    downwardDogStatus = 'Too Folded'
  } else if (armAngle < 160) {
    downwardDogStatus = 'Bend Arms'
  } else if (legAngle < 160) {
    downwardDogStatus = 'Bend Knees'
  }

  return {
    leftHipAngle,
    rightHipAngle,
    hipAngle,
    leftArmAngle,
    rightArmAngle,
    armAngle,
    leftLegAngle,
    rightLegAngle,
    legAngle,
    downwardDogStatus
  }
}

export function getSquatMetrics(keypoints: Keypoint[]): SquatMetrics | null {
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

export function getPlankMetrics(keypoints: Keypoint[]): PlankMetrics | null {
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

export function getSquatFeedback(
  keypoints: Keypoint[],
  metrics: SquatMetrics | null
): PoseFeedback {
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

export function getPlankFeedback(
  keypoints: Keypoint[],
  metrics: PlankMetrics | null
): PoseFeedback {
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

export function getDownwardDogFeedback(
  keypoints: Keypoint[],
  metrics: DownwardDogMetrics | null
): PoseFeedback {
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
      code: 'downward-dog-missing-body',
      message: 'Keep your shoulders, elbows, wrists, hips, knees, and ankles visible.'
    }
  }

  if (metrics.downwardDogStatus === 'Hips Too Low') {
    return {
      kind: 'bad',
      code: 'downward-dog-hips-low',
      message: 'Lift your hips.'
    }
  }

  if (metrics.downwardDogStatus === 'Too Folded') {
    return {
      kind: 'bad',
      code: 'downward-dog-too-folded',
      message: 'Open your hips.'
    }
  }

  if (metrics.downwardDogStatus === 'Bend Arms') {
    return {
      kind: 'bad',
      code: 'downward-dog-arms-bent',
      message: 'Straighten your arms.'
    }
  }

  if (metrics.downwardDogStatus === 'Bend Knees') {
    return {
      kind: 'bad',
      code: 'downward-dog-knees-bent',
      message: 'Straighten your legs.'
    }
  }

  return {
    kind: 'good',
    code: 'good'
  }
}

export function syncOverlayCanvas(canvas: HTMLCanvasElement) {
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

export function drawPoseOverlay(
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
  ctx.strokeStyle = theme.palette.primary.dark
  ctx.fillStyle = theme.palette.primary.main

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

export function clearPoseOverlay(canvas: HTMLCanvasElement) {
  const synced = syncOverlayCanvas(canvas)

  if (!synced) {
    return
  }

  synced.ctx.clearRect(0, 0, synced.cssWidth, synced.cssHeight)
}
