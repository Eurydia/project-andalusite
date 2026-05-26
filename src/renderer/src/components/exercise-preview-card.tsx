import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import { ExerciseData } from '@renderer/types'
import { FC, useState } from 'react'
import { DifficultyBadge } from './difficulty-badge'
import { ExerciseDialog } from './exercise-dialog'

export const ExercisePreviewCard: FC<{
  data: ExerciseData
  onboarding: {
    shouldRun: boolean
    onFinished: () => unknown
  }
}> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Card variant="outlined">
        <CardActionArea
          onClick={() => setDialogOpen(true)}
          disableTouchRipple
          disabled={props.data.soon}
        >
          <CardMedia
            image={props.data.thumbnailSrc}
            sx={{
              objectFit: 'contain',
              backgroundColor: (t) => t.palette.primary.light,
              aspectRatio: '16/10'
            }}
          />
          <CardHeader
            title={`${props.data.name}${props.data.soon ? ` (coming soon!)` : ''}`}
            subheader={<DifficultyBadge variant={props.data.difficulty} />}
            slotProps={{
              title: {
                sx: {
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  fontWeight: 700
                }
              }
            }}
          />
        </CardActionArea>
      </Card>
      {!props.data.soon && (
        <ExerciseDialog
          data={props.data}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onboarding={props.onboarding}
        />
      )}
    </>
  )
}
