export type ExerciseType = 'squat' | 'plank'

export type Keypoint = {
  x: number
  y: number
  score: number
}

export type SquatMetrics = {
  exercise: 'squat'
  leftKneeAngle: number
  rightKneeAngle: number
  averageKneeAngle: number
  squatStatus: 'Standing' | 'Good Squat' | 'Too Deep'
  stanceRatio: number
  stanceStatus: 'Normal' | 'Too Narrow' | 'Too Wide'
}

export type PlankMetrics = {
  exercise: 'plank'
  leftHipAngle: number
  rightHipAngle: number
  plankAngle: number
  plankStatus: 'Good Plank' | 'Hips Too Low' | 'Hips Too High'
}

export type PoseMetrics = SquatMetrics | PlankMetrics

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

function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint) {
  const baX = a.x - b.x
  const baY = a.y - b.y

  const bcX = c.x - b.x
  const bcY = c.y - b.y

  const baLength = Math.hypot(baX, baY)
  const bcLength = Math.hypot(bcX, bcY)

  if (baLength === 0 || bcLength === 0) return 0

  const cosine = (baX * bcX + baY * bcY) / (baLength * bcLength)
  const clamped = Math.max(-1, Math.min(1, cosine))

  return (Math.acos(clamped) * 180) / Math.PI
}

function calculateDistance(a: Keypoint, b: Keypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function validNumber(value: number) {
  return Number.isFinite(value) ? value : 0
}

export function calculatePoseMetrics(exercise: ExerciseType, keypoints: Keypoint[]): PoseMetrics {
  if (exercise === 'squat') {
    const leftShoulder = keypoints[5]
    const rightShoulder = keypoints[6]

    const leftHip = keypoints[11]
    const rightHip = keypoints[12]

    const leftKnee = keypoints[13]
    const rightKnee = keypoints[14]

    const leftAnkle = keypoints[15]
    const rightAnkle = keypoints[16]

    const leftKneeAngle = validNumber(calculateAngle(leftHip, leftKnee, leftAnkle))

    const rightKneeAngle = validNumber(calculateAngle(rightHip, rightKnee, rightAnkle))

    const averageKneeAngle = validNumber((leftKneeAngle + rightKneeAngle) / 2)

    let squatStatus: SquatMetrics['squatStatus'] = 'Standing'

    if (averageKneeAngle < 130) {
      squatStatus = 'Good Squat'
    }

    if (averageKneeAngle < 80) {
      squatStatus = 'Too Deep'
    }

    const shoulderWidth = calculateDistance(leftShoulder, rightShoulder)
    const ankleWidth = calculateDistance(leftAnkle, rightAnkle)

    const stanceRatio = shoulderWidth === 0 ? 0 : ankleWidth / shoulderWidth

    let stanceStatus: SquatMetrics['stanceStatus'] = 'Normal'

    if (stanceRatio < 0.8) {
      stanceStatus = 'Too Narrow'
    } else if (stanceRatio > 1.5) {
      stanceStatus = 'Too Wide'
    }

    return {
      exercise: 'squat',
      leftKneeAngle,
      rightKneeAngle,
      averageKneeAngle,
      squatStatus,
      stanceRatio,
      stanceStatus
    }
  }

  const leftShoulder = keypoints[5]
  const leftHip = keypoints[11]
  const leftAnkle = keypoints[15]

  const rightShoulder = keypoints[6]
  const rightHip = keypoints[12]
  const rightAnkle = keypoints[16]

  const leftHipAngle = validNumber(calculateAngle(leftShoulder, leftHip, leftAnkle))

  const rightHipAngle = validNumber(calculateAngle(rightShoulder, rightHip, rightAnkle))

  const plankAngle = validNumber((leftHipAngle + rightHipAngle) / 2)

  let plankStatus: PlankMetrics['plankStatus'] = 'Good Plank'

  if (plankAngle < 165) {
    plankStatus = 'Hips Too Low'
  } else if (plankAngle > 190) {
    plankStatus = 'Hips Too High'
  }

  return {
    exercise: 'plank',
    leftHipAngle,
    rightHipAngle,
    plankAngle,
    plankStatus
  }
}
