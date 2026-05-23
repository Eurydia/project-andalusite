export type ExerciseData = {
  exerciseId: string
  name: string
  explanation: string
  thumbnailSrc: string
  videoSrc: string
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
}
