import { ipcMain } from 'electron'
import * as ort from 'onnxruntime-node'
import { join } from 'path'

type Keypoint = {
  x: number
  y: number
  score: number
}

type Letterbox = {
  scale: number
  padX: number
  padY: number
  sourceWidth: number
  sourceHeight: number
}

let sessionPromise: Promise<ort.InferenceSession> | undefined

function getSession() {
  sessionPromise ??= ort.InferenceSession.create(
    join(process.cwd(), 'resources', 'models', 'yolo26n-pose.onnx'),
    {
      executionProviders: ['cpu']
    }
  )

  return sessionPromise
}

function preprocessRgbaFrame(input: {
  rgba: Uint8ClampedArray
  width: number
  height: number
  inputSize: number
}) {
  const { rgba, width, height, inputSize } = input

  const scale = Math.min(inputSize / width, inputSize / height)
  const resizedWidth = Math.round(width * scale)
  const resizedHeight = Math.round(height * scale)
  const padX = Math.floor((inputSize - resizedWidth) / 2)
  const padY = Math.floor((inputSize - resizedHeight) / 2)

  const resized = new Uint8ClampedArray(inputSize * inputSize * 4)

  for (let i = 0; i < inputSize * inputSize; i++) {
    resized[i * 4] = 114
    resized[i * 4 + 1] = 114
    resized[i * 4 + 2] = 114
    resized[i * 4 + 3] = 255
  }

  for (let y = 0; y < resizedHeight; y++) {
    const srcY = Math.min(height - 1, Math.floor(y / scale))

    for (let x = 0; x < resizedWidth; x++) {
      const srcX = Math.min(width - 1, Math.floor(x / scale))

      const srcIndex = (srcY * width + srcX) * 4
      const dstIndex = ((y + padY) * inputSize + (x + padX)) * 4

      resized[dstIndex] = rgba[srcIndex]
      resized[dstIndex + 1] = rgba[srcIndex + 1]
      resized[dstIndex + 2] = rgba[srcIndex + 2]
      resized[dstIndex + 3] = 255
    }
  }

  const pixels = inputSize * inputSize
  const tensorData = new Float32Array(3 * pixels)

  for (let i = 0; i < pixels; i++) {
    const rgbaIndex = i * 4

    tensorData[i] = resized[rgbaIndex] / 255
    tensorData[pixels + i] = resized[rgbaIndex + 1] / 255
    tensorData[pixels * 2 + i] = resized[rgbaIndex + 2] / 255
  }

  return {
    tensor: new ort.Tensor('float32', tensorData, [1, 3, inputSize, inputSize]),
    letterbox: {
      scale,
      padX,
      padY,
      sourceWidth: width,
      sourceHeight: height
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

  if (itemSize < 56) {
    throw new Error(`Expected YOLO pose item size >= 56, got ${itemSize}`)
  }

  const get = (candidateIndex: number, valueIndex: number) => {
    if (channelsFirst) {
      return data[valueIndex * candidateCount + candidateIndex]
    }

    return data[candidateIndex * itemSize + valueIndex]
  }

  let bestScore = -Infinity
  let bestKeypoints: Keypoint[] | null = null

  for (let i = 0; i < candidateCount; i++) {
    const score = get(i, 4)

    if (score < 0.25) continue
    if (score <= bestScore) continue

    const keypoints: Keypoint[] = []

    for (let k = 0; k < 17; k++) {
      const base = 5 + k * 3

      const modelX = get(i, base)
      const modelY = get(i, base + 1)
      const keypointScore = get(i, base + 2)

      keypoints.push({
        x: Math.max(
          0,
          Math.min(letterbox.sourceWidth, (modelX - letterbox.padX) / letterbox.scale)
        ),
        y: Math.max(
          0,
          Math.min(letterbox.sourceHeight, (modelY - letterbox.padY) / letterbox.scale)
        ),
        score: keypointScore
      })
    }

    bestScore = score
    bestKeypoints = keypoints
  }

  return bestKeypoints
}

export function registerPoseIpc() {
  ipcMain.handle(
    'pose:run-frame',
    async (
      _event,
      payload: {
        rgba: Uint8ClampedArray
        width: number
        height: number
      }
    ) => {
      const session = await getSession()

      const { tensor, letterbox } = preprocessRgbaFrame({
        rgba: payload.rgba,
        width: payload.width,
        height: payload.height,
        inputSize: 640
      })

      const inputName = session.inputNames[0]
      const outputName = session.outputNames[0]

      const outputs = await session.run({
        [inputName]: tensor
      })

      return parseBestPose(outputs[outputName], letterbox)
    }
  )
}
