import { Grid } from '@mui/material'
import { FC } from 'react'
import { ExercisePreviewCard } from './exercise-preview-card'

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
          <ExercisePreviewCard
            htmlId={exerciseCardHtmlId}
            exerciseId={'2e8e83e9-fcf2-40d2-aed0-dbbdf14b7704'}
            name={'EXERCISE ' + props.difficulty + i.toString().padStart(2, '0')}
            explanation={
              'lorem pharetra. Quisque volutpat facilisis pharetra. Donec eleifend mauris et tellus mattis dignissim in vehicula turpis. Morbi eu augue eget sapien aliquet lacinia eget tincidunt odio. Etiam malesuada rhoncus cursus. Suspendisse tempor bibendum hendrerit. Quisque interdum ligula et luctus fermentum. Sed molestie porta tortor, ut ullamcorper leo iaculis eget.  '
            }
            thumbnailSrc={'https://placehold.co/600x400'}
            videoClipSrc={'https://www.youtube.com/embed/BPK9WNtpBgk'}
            difficulty={props.difficulty}
          />
        </Grid>
      )
    })}
  </Grid>
)
