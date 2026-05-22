import { Card, CardHeader, Skeleton } from '@mui/material'
import { FC } from 'react'

export const ExercisePreviewCardSkeleton: FC = () => {
  return (
    <Card variant="outlined">
      <Skeleton variant="circular" sx={{ width: '100%', aspectRatio: '16/10' }} />

      <CardHeader
        title={}
        subheader={badge}
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
    </Card>
  )
}
