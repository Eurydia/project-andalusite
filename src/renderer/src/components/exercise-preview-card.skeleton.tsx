import { Box, Card, CardHeader, Skeleton } from '@mui/material'
import { FC } from 'react'

export const ExercisePreviewCardSkeleton: FC = () => {
  return (
    <Card variant="outlined">
      <Box sx={{ width: '100%', aspectRatio: '16/10' }}>
        <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} />
      </Box>
      <CardHeader
        title={<Skeleton />}
        subheader={<Skeleton sx={{ width: '20%' }} />}
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
