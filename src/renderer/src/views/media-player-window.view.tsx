import { HelpRounded, SearchRounded } from '@mui/icons-material'
import {
  AppBar,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material'
import { ExerciseGroupDisplay } from '@renderer/components/exercise-group-display'
import { FC } from 'react'

export const View$MainWindow: FC = () => {
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
          <ExerciseGroupDisplay difficulty="BASIC" />
          <Typography sx={{ fontWeight: 900 }} variant="h2">{`Intermediate`}</Typography>
          <ExerciseGroupDisplay difficulty="INTERMEDIATE" />
          <Typography sx={{ fontWeight: 900 }} variant="h2">{`Advanced`}</Typography>
          <ExerciseGroupDisplay difficulty="ADVANCED" />
        </Stack>
      </Container>
    </>
  )
}
