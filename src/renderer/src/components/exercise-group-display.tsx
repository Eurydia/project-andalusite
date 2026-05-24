import { Grid } from '@mui/material'
import { ExerciseData } from '@renderer/types'
import { FC } from 'react'
import { ExercisePreviewCard } from './exercise-preview-card'

export const ExerciseGroupDisplay: FC<{
  items: Array<ExerciseData>
}> = (props) => (
  <Grid container spacing={4}>
    {props.items.map((item, i) => {
      const exerciseCardHtmlId = `exercise-card-${item?.difficulty.toLowerCase()}-${i}`

      return (
        <Grid size={{ lg: 4, sm: 6 }} key={exerciseCardHtmlId}>
          <ExercisePreviewCard htmlId={exerciseCardHtmlId} data={item} />
        </Grid>
      )
    })}
  </Grid>
)
