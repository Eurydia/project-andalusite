import { HelpRounded, SearchRounded } from '@mui/icons-material'
import {
  AppBar,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { ExerciseGroupDisplay } from '@renderer/components/exercise-group-display'
import { FC, useEffect, useMemo, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'

export const View$MainWindow: FC = () => {
  const [settingDialogOpen, setSettingDialogOpen] = useState(false)
  const [tourRun, setTourRun] = useState(false)

  const tourSteps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="exercise-search"]',
        content: 'Search exercises by name, tag, difficulty, or duration.',
        placement: 'bottom',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-results"]',
        content: 'Available exercises are shown here.',
        placement: 'top',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-card"]',
        content: 'Click an exercise to open its preview.',
        placement: 'top',
        skipBeacon: true
      }
    ],
    []
  )

  useEffect(() => {
    setTourRun(true)
  }, [])

  function handleTourEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setTourRun(false)
    }
  }
  const t = useTheme()

  return (
    <>
      <Joyride
        run={tourRun}
        continuous
        steps={tourSteps}
        onEvent={handleTourEvent}
        options={{
          zIndex: t.zIndex.appBar + 1,
          skipBeacon: true,
          showProgress: true,
          spotlightPadding: 12,
          backgroundColor: '#111111',
          textColor: '#ffffff',
          primaryColor: '#ffffff',
          arrowColor: '#111111',
          overlayColor: 'rgba(0, 0, 0, 0.48)'
        }}
      />

      <AppBar color="default" position="sticky">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography>{`Information`}</Typography>
          <Typography>{`Exercise poses`}</Typography>
          <Button onClick={() => setSettingDialogOpen(true)}>
            <Typography>{`Settings`}</Typography>
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ paddingY: 4 }}>
          <Toolbar disableGutters data-tour="exercise-search">
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
                          <Typography>{`Search exercises using tags, name, difficulty or duration.`}</Typography>
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

          <Stack spacing={4} data-tour="exercise-results">
            <Typography sx={{ fontWeight: 900 }} variant="h2">{`Basic`}</Typography>
            <ExerciseGroupDisplay difficulty="BASIC" />

            <Typography sx={{ fontWeight: 900 }} variant="h2">{`Intermediate`}</Typography>
            <ExerciseGroupDisplay difficulty="INTERMEDIATE" />

            <Typography sx={{ fontWeight: 900 }} variant="h2">{`Advanced`}</Typography>
            <ExerciseGroupDisplay difficulty="ADVANCED" />
          </Stack>
        </Stack>
      </Container>

      <Dialog
        fullWidth
        maxWidth="md"
        open={settingDialogOpen}
        onClose={() => setSettingDialogOpen(false)}
      >
        <DialogTitle>{`Settings`}</DialogTitle>
        <DialogContent>
          <DialogContentText>{`Hang on tight. This feature will be coming soon 😉`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingDialogOpen(false)}>{`Close`}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
