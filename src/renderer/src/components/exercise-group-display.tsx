import { Grid } from '@mui/material'
import { ExerciseData } from '@renderer/types'
import { FC } from 'react'
import { ExercisePreviewCard } from './exercise-preview-card'

export const ExerciseGroupDisplay: FC<{
  items: Array<ExerciseData>
  idPrefix: string
  onboarding: {
    shouldRun: boolean
    onFinished: () => unknown
  }
}> = (props) => (
  <Grid container spacing={4}>
    {props.items.map((item, i) => {
      return (
        <Grid size={{ lg: 4, sm: 6 }} key={i}>
          <div data-onboarding={`${props.idPrefix}-${i}`}>
            <ExercisePreviewCard data={item} onboarding={props.onboarding} />
          </div>
        </Grid>
      )
    })}
  </Grid>
)
