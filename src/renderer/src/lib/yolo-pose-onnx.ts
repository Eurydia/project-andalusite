import * as ort from 'onnxruntime-web'
import {
  COCO_SKELETON,
  ExerciseType,
  Keypoint,
  PoseMetrics,
  calculatePoseMetrics
} from './pose-metrics'

ort.env.wasm.wasmPaths = '/ort-wasm/'

export type PoseResult = {
  keypoints: Keypoint[]
  metrics: PoseMetrics
}

type Letterbox = {
  scale: number
  padX: number
  padY: number
  sourceWidth: number
  sourceHeight: number
}

export class YoloPoseOnnxRunner {
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
    if (this.session) return

    this.session = await ort.InferenceSession.create(
      this.options.modelUrl ?? '/models/yolo26n-pose.onnx',
      {
        executionProviders: ['wasm']
      }
    )

    console.log('YOLO input names:', this.session.inputNames)
    console.log('YOLO output names:', this.session.outputNames)
  }

  async runVideoFrame(video: HTMLVideoElement, exercise: ExerciseType): Promise<PoseResult | null> {
    await this.load()

    if (!this.session) return null
    if (!video.videoWidth || !video.videoHeight) return null

    const { tensor, letterbox } = this.preprocess(video)

    const inputName = this.session.inputNames[0]
    const outputs = await this.session.run({ [inputName]: tensor })

    const outputName = this.session.outputNames[0]
    const output = outputs[outputName]

    const keypoints = this.parseBestPose(output, letterbox)

    if (!keypoints) return null

    return {
      keypoints,
      metrics: calculatePoseMetrics(exercise, keypoints)
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

    console.log('YOLO output shape:', dims)

    if (dims.length !== 3) {
      throw new Error(`Unsupported YOLO output shape: ${dims.join('x')}`)
    }

    const a = dims[1]
    const b = dims[2]

    const channelsFirst = a < b

    const itemSize = channelsFirst ? a : b
    const candidateCount = channelsFirst ? b : a

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
      const score = get(i, 4)

      if (score < confidenceThreshold) continue
      if (score <= bestScore) continue

      const keypoints: Keypoint[] = []

      for (let k = 0; k < 17; k++) {
        const base = 5 + k * 3

        const modelX = get(i, base)
        const modelY = get(i, base + 1)
        const keypointScore = get(i, base + 2)

        const x = (modelX - letterbox.padX) / letterbox.scale
        const y = (modelY - letterbox.padY) / letterbox.scale

        keypoints.push({
          x: Math.max(0, Math.min(letterbox.sourceWidth, x)),
          y: Math.max(0, Math.min(letterbox.sourceHeight, y)),
          score: keypointScore
        })
      }

      bestScore = score
      bestKeypoints = keypoints
    }

    return bestKeypoints
  }
}

export function drawPoseOverlay(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.lineWidth = 3
  ctx.strokeStyle = '#00c853'
  ctx.fillStyle = '#ff1744'
  ctx.font = '18px sans-serif'

  for (const [from, to] of COCO_SKELETON) {
    const a = keypoints[from]
    const b = keypoints[to]

    if (!a || !b) continue
    if (a.score < 0.2 || b.score < 0.2) continue

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  for (const point of keypoints) {
    if (point.score < 0.2) continue

    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
