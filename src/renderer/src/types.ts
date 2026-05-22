export type ExerciseData = {
  exerciseId: string
  name: string
  explanation: string
  thumbnailSrc: string
  videoClipSrc: string
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
}
