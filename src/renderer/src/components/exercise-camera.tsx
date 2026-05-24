import { Box, Stack, Typography } from '@mui/material'
import { ExerciseType } from '@renderer/lib/pose-metrics'
import { PoseResult, YoloPoseOnnxRunner, drawPoseOverlay } from '@renderer/lib/yolo-pose-onnx'
import { useEffect, useRef, useState } from 'react'

export function ExerciseCamera(props: { stream: MediaStream; exercise: ExerciseType }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const runnerRef = useRef<YoloPoseOnnxRunner | null>(null)

  const [poseResult, setPoseResult] = useState<PoseResult | null>(null)

  useEffect(() => {
    let disposed = false
    let rafId = 0
    let runningInference = false

    async function start() {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) return

      runnerRef.current = new YoloPoseOnnxRunner({
        modelUrl: '/models/yolo26n-pose.onnx',
        inputSize: 640,
        confidenceThreshold: 0.25
      })

      await runnerRef.current.load()

      if (disposed) return

      video.srcObject = props.stream
      await video.play()

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')

      if (!ctx) return

      const tick = async () => {
        if (disposed) return

        if (!runningInference && runnerRef.current && video.readyState >= 2) {
          runningInference = true

          try {
            const result = await runnerRef.current.runVideoFrame(video, props.exercise)

            if (result) {
              setPoseResult(result)
              drawPoseOverlay(ctx, result.keypoints)
            }
          } finally {
            runningInference = false
          }
        }

        rafId = requestAnimationFrame(tick)
      }

      tick()
    }

    start()

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)

      const video = videoRef.current

      if (video) {
        video.pause()
        video.srcObject = null
      }
    }
  }, [props.stream, props.exercise])

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          position: 'relative',
          width: 720,
          maxWidth: '100%'
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            display: 'block',
            borderRadius: 16
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

      {poseResult?.metrics.exercise === 'squat' && (
        <Stack spacing={0.5}>
          <Typography>Left knee: {poseResult.metrics.leftKneeAngle.toFixed(0)}°</Typography>

          <Typography>Right knee: {poseResult.metrics.rightKneeAngle.toFixed(0)}°</Typography>

          <Typography>Average knee: {poseResult.metrics.averageKneeAngle.toFixed(0)}°</Typography>

          <Typography>Squat: {poseResult.metrics.squatStatus}</Typography>

          <Typography>Stance ratio: {poseResult.metrics.stanceRatio.toFixed(2)}</Typography>

          <Typography>Stance: {poseResult.metrics.stanceStatus}</Typography>
        </Stack>
      )}

      {poseResult?.metrics.exercise === 'plank' && (
        <Stack spacing={0.5}>
          <Typography>Left hip: {poseResult.metrics.leftHipAngle.toFixed(0)}°</Typography>

          <Typography>Right hip: {poseResult.metrics.rightHipAngle.toFixed(0)}°</Typography>

          <Typography>Plank angle: {poseResult.metrics.plankAngle.toFixed(0)}°</Typography>

          <Typography>Status: {poseResult.metrics.plankStatus}</Typography>
        </Stack>
      )}
    </Stack>
  )
}
