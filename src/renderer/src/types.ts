export type ExerciseData = {
  name: string
  thumbnailSrc: string
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
} & ({ soon?: false; exerciseId: string; explanation: string; videoSrc: string } | { soon: true })
