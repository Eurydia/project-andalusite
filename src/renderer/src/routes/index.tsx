import { HelpRounded, SearchRounded } from '@mui/icons-material'
import {
  AppBar,
  Container,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material'
import { ExercisePreviewCard } from '@renderer/components/exercise-preview-card'
import { createFileRoute } from '@tanstack/react-router'
import { FC } from 'react'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

const Board: FC<{ difficulty: 'ADVANCED' | 'BASIC' | 'INTERMEDIATE' }> = (props) => (
  <Grid container spacing={4}>
    {Array.from({ length: 3 }).map((_, i) => (
      <Grid size={4} key={i}>
        <ExercisePreviewCard
          exerciseId={'2e8e83e9-fcf2-40d2-aed0-dbbdf14b7704'}
          name={'EXERCISE ' + props.difficulty + i.toString().padStart(2, '0')}
          explanation={
            'lorem pharetra. Quisque volutpat facilisis pharetra. Donec eleifend mauris et tellus mattis dignissim in vehicula turpis. Morbi eu augue eget sapien aliquet lacinia eget tincidunt odio. Etiam malesuada rhoncus cursus. Suspendisse tempor bibendum hendrerit. Quisque interdum ligula et luctus fermentum. Sed molestie porta tortor, ut ullamcorper leo iaculis eget.  '
          }
          thumbnailSrc={'https://placehold.co/600x400'}
          videoClipSrc={'https://www.youtube.com/embed/BPK9WNtpBgk'}
          difficulty={props.difficulty}
          approxDurationSeconds={120}
          tags={'Quisque volutpat facilisis pharetra'.split(' ')}
        />
      </Grid>
    ))}
  </Grid>
)

function RouteComponent() {
  return (
    <>
      <AppBar color="default" position="sticky">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography>{`Information`}</Typography>
          <Typography>{`Exercise poses`}</Typography>
          <Typography>{`Settings`}</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ paddingY: 4 }}>
          <Toolbar disableGutters>
            <TextField
              fullWidth
              placeholder="Search exercises"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={
                          <Typography>{`Search exerices using tags, name, difficulty or duration.`}</Typography>
                        }
                      >
                        <HelpRounded sx={{ cursor: 'pointer' }} />
                      </Tooltip>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Toolbar>
          <Typography sx={{ fontWeight: 900 }} variant="h2">{`Basic`}</Typography>
          <Board difficulty="BASIC" />
          <Typography sx={{ fontWeight: 900 }} variant="h2">{`Intermediate`}</Typography>
          <Board difficulty="INTERMEDIATE" />
          <Typography sx={{ fontWeight: 900 }} variant="h2">{`Advanced`}</Typography>
          <Board difficulty="ADVANCED" />
        </Stack>
      </Container>
    </>
  )
}
