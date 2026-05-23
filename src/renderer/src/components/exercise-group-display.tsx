import { Grid } from '@mui/material'
import { FC } from 'react'
import { ExercisePreviewCard } from './exercise-preview-card'
import { ExercisePreviewCardSkeleton } from './exercise-preview-card.skeleton'

export const ExerciseGroupDisplay: FC<{
  items: Array<{
    exerciseId: string
    difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
    name: string
    explanation: string
    thumbnailSrc: string
    videoSrc: string
  } | null>
}> = (props) => (
  <Grid container spacing={4}>
    {props.items.map((item, i) => {
      const exerciseCardHtmlId = `exercise-card-${item?.difficulty.toLowerCase()}-${i}`

      return (
        <Grid size={{ lg: 4, sm: 6 }} key={exerciseCardHtmlId}>
          {item !== null ? (
            <ExercisePreviewCard htmlId={exerciseCardHtmlId} data={item} />
          ) : (
            <ExercisePreviewCardSkeleton />
          )}
        </Grid>
      )
    })}
  </Grid>
)
