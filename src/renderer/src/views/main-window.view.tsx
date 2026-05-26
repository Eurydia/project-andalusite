import HelpRounded from '@mui/icons-material/HelpRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import {
  AppBar,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material'
import {
  ADVANCED_EXERCISES,
  BASIC_EXERCISES,
  INTERMEDIATE_EXERCISES
} from '@renderer/assets/exercises'
import { AboutAppDialog } from '@renderer/components/about-app-dialog'
import { ExerciseGroupDisplay } from '@renderer/components/exercise-group-display'
import { Onboarding$Home } from '@renderer/components/onboarding/home.onboarding'
import { SettingsDialog } from '@renderer/components/settings-dialog'
import { FC, useState } from 'react'

export const View$MainWindow: FC<{
  onboarding: {
    home: {
      shouldRun: boolean
      onFinished: () => unknown
    }
    card: {
      shouldRun: boolean
      onFinished: () => unknown
    }
  }
}> = (props) => {
  const [settingDialogOpen, setSettingDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  return (
    <>
      <Onboarding$Home
        shouldRun={props.onboarding.home.shouldRun}
        targets={{
          searchBar: '[data-onboarding="searchbox"]',
          exerciseDisplay: '[data-onboarding="exercise-display"]',
          exerciseCard: '[data-onboarding="basic-0"]'
        }}
        onFinished={props.onboarding.home.onFinished}
      />
      <AppBar position="relative">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Button color="secondary" onClick={() => setAboutDialogOpen(true)} variant="text">
            {`About`}
          </Button>
          <Typography>{`EXERCISES`}</Typography>
          <IconButton onClick={() => setSettingDialogOpen(true)}>
            <SettingsRounded />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Stack spacing={4} sx={{ paddingY: 4 }}>
          <Toolbar disableGutters component={'div'} data-onboarding="searchbox">
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

          <Stack spacing={4} data-onboarding="exercise-display">
            <Typography sx={{ fontWeight: 900 }} variant="h2">{`Basic`}</Typography>
            <ExerciseGroupDisplay
              idPrefix="basic"
              items={BASIC_EXERCISES}
              onboarding={props.onboarding.card}
            />

            <Typography sx={{ fontWeight: 900 }} variant="h2">{`Intermediate`}</Typography>
            <ExerciseGroupDisplay
              idPrefix="intermediate"
              items={INTERMEDIATE_EXERCISES}
              onboarding={props.onboarding.card}
            />

            <Typography sx={{ fontWeight: 900 }} variant="h2">{`Advanced`}</Typography>
            <ExerciseGroupDisplay
              idPrefix="advanced"
              items={ADVANCED_EXERCISES}
              onboarding={props.onboarding.card}
            />
          </Stack>
        </Stack>
      </Container>
      <SettingsDialog open={settingDialogOpen} onClose={() => setSettingDialogOpen(false)} />
      <AboutAppDialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} />
    </>
  )
}
