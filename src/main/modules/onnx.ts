import { app, ipcMain } from 'electron'
import { existsSync } from 'fs'
import * as ort from 'onnxruntime-node'
import { join } from 'path'

type Keypoint = {
  x: number
  y: number
  score: number
}

type RunPoseFramePayload = {
  rgba: Uint8ClampedArray | Uint8Array | number[]
  width: number
  height: number
}

type Letterbox = {
  scale: number
  padX: number
  padY: number
  sourceWidth: number
  sourceHeight: number
  inputSize: number
}

const INPUT_SIZE = 640
const KEYPOINT_COUNT = 17
const KEYPOINT_VALUE_COUNT = KEYPOINT_COUNT * 3
const DETECTION_THRESHOLD = 0.01

let sessionPromise: Promise<ort.InferenceSession> | undefined

function getModelPath() {
  const devPath = join(process.cwd(), 'resources', 'models', 'yolo26n-pose.onnx')
  const packagedPath = join(process.resourcesPath, 'models', 'yolo26n-pose.onnx')

  if (existsSync(devPath)) return devPath
  if (existsSync(packagedPath)) return packagedPath

  return devPath
}

function getSession() {
  sessionPromise ??= ort.InferenceSession.create(getModelPath(), {
    executionProviders: ['cpu']
  })

  return sessionPromise
}

function getRgba(payload: RunPoseFramePayload) {
  if (payload.rgba instanceof Uint8ClampedArray) {
    return payload.rgba
  }

  if (payload.rgba instanceof Uint8Array) {
    return new Uint8ClampedArray(
      payload.rgba.buffer,
      payload.rgba.byteOffset,
      payload.rgba.byteLength
    )
  }

  return new Uint8ClampedArray(payload.rgba)
}

function preprocessFrame(payload: RunPoseFramePayload) {
  const sourceWidth = payload.width
  const sourceHeight = payload.height
  const rgba = getRgba(payload)

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error(`Invalid frame size: ${sourceWidth}x${sourceHeight}`)
  }

  const expectedLength = sourceWidth * sourceHeight * 4

  if (rgba.length < expectedLength) {
    throw new Error(`Invalid RGBA buffer length: expected ${expectedLength}, got ${rgba.length}`)
  }

  const scale = Math.min(INPUT_SIZE / sourceWidth, INPUT_SIZE / sourceHeight)
  const resizedWidth = Math.round(sourceWidth * scale)
  const resizedHeight = Math.round(sourceHeight * scale)

  const padX = Math.floor((INPUT_SIZE - resizedWidth) / 2)
  const padY = Math.floor((INPUT_SIZE - resizedHeight) / 2)

  const pixels = INPUT_SIZE * INPUT_SIZE
  const tensorData = new Float32Array(3 * pixels)

  tensorData.fill(114 / 255)

  for (let targetY = 0; targetY < resizedHeight; targetY++) {
    const sourceY = Math.min(sourceHeight - 1, Math.round(targetY / scale))

    for (let targetX = 0; targetX < resizedWidth; targetX++) {
      const sourceX = Math.min(sourceWidth - 1, Math.round(targetX / scale))

      const sourceIndex = (sourceY * sourceWidth + sourceX) * 4
      const modelX = targetX + padX
      const modelY = targetY + padY
      const modelIndex = modelY * INPUT_SIZE + modelX

      tensorData[modelIndex] = rgba[sourceIndex] / 255
      tensorData[pixels + modelIndex] = rgba[sourceIndex + 1] / 255
      tensorData[pixels * 2 + modelIndex] = rgba[sourceIndex + 2] / 255
    }
  }

  return {
    tensor: new ort.Tensor('float32', tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE]),
    letterbox: {
      scale,
      padX,
      padY,
      sourceWidth,
      sourceHeight,
      inputSize: INPUT_SIZE
    } satisfies Letterbox
  }
}

function parseBestPose(output: ort.Tensor, letterbox: Letterbox): Keypoint[] | null {
  const data = output.data as Float32Array
  const dims = output.dims

  if (dims.length !== 3) {
    throw new Error(`Unsupported YOLO output shape: ${dims.join('x')}`)
  }

  const channelsFirst = dims[1] < dims[2]
  const itemSize = channelsFirst ? dims[1] : dims[2]
  const candidateCount = channelsFirst ? dims[2] : dims[1]

  if (itemSize < 5 + KEYPOINT_VALUE_COUNT) {
    throw new Error(`Expected YOLO pose item size >= ${5 + KEYPOINT_VALUE_COUNT}, got ${itemSize}`)
  }

  const keypointStart = itemSize - KEYPOINT_VALUE_COUNT

  const get = (candidateIndex: number, valueIndex: number) => {
    if (channelsFirst) {
      return data[valueIndex * candidateCount + candidateIndex]
    }

    return data[candidateIndex * itemSize + valueIndex]
  }

  let bestScore = -Infinity
  let bestKeypoints: Keypoint[] | null = null

  for (let i = 0; i < candidateCount; i++) {
    const detectionScore = get(i, 4)

    if (!Number.isFinite(detectionScore)) {
      continue
    }

    if (detectionScore < DETECTION_THRESHOLD) {
      continue
    }

    if (detectionScore <= bestScore) {
      continue
    }

    const keypoints: Keypoint[] = []

    for (let k = 0; k < KEYPOINT_COUNT; k++) {
      const base = keypointStart + k * 3

      let modelX = get(i, base)
      let modelY = get(i, base + 1)
      let score = get(i, base + 2)

      if (!Number.isFinite(modelX)) modelX = 0
      if (!Number.isFinite(modelY)) modelY = 0
      if (!Number.isFinite(score)) score = 0

      if (Math.abs(modelX) <= 1.5 && Math.abs(modelY) <= 1.5) {
        modelX *= letterbox.inputSize
        modelY *= letterbox.inputSize
      }

      if (score < 0) score = 0
      if (score > 1) score = 1

      const x = (modelX - letterbox.padX) / letterbox.scale
      const y = (modelY - letterbox.padY) / letterbox.scale

      keypoints.push({
        x: Math.max(0, Math.min(letterbox.sourceWidth, x)),
        y: Math.max(0, Math.min(letterbox.sourceHeight, y)),
        score
      })
    }

    bestScore = detectionScore
    bestKeypoints = keypoints
  }

  return bestKeypoints
}

export function registerPoseIpc() {
  ipcMain.removeHandler('pose:run-frame')

  ipcMain.handle('pose:run-frame', async (_event, payload: RunPoseFramePayload) => {
    const session = await getSession()
    const { tensor, letterbox } = preprocessFrame(payload)

    const inputName = session.inputNames[0]
    const outputName = session.outputNames[0]

    const outputs = await session.run({
      [inputName]: tensor
    })

    const output = outputs[outputName]

    if (!output) {
      throw new Error(`ONNX output not found: ${outputName}`)
    }

    return parseBestPose(output, letterbox)
  })

  app.once('before-quit', () => {
    sessionPromise = undefined
  })
}
