import { KeyboardArrowLeftRounded, SelfImprovementRounded } from '@mui/icons-material'
import Whatshot from '@mui/icons-material/Whatshot'
import { Button, Toolbar } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import ReactPlayer from 'react-player'
import { StyledRouterLinkButton } from './styled-router-link-button'

export const ExercisePreviewCard: FC<{
  htmlId?: string
  exerciseId: string
  name: string
  explanation: string
  thumbnailSrc: string
  videoClipSrc: string
  approxDurationSeconds: number
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  tags: Array<string>
}> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTourRun, setDialogTourRun] = useState(false)

  const openDialog = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setDialogTourRun(false)
  }, [])

  const dialogTourSteps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="exercise-video-preview"]',
        content: 'Preview the exercise movement before starting.',
        placement: 'right',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-title"]',
        content: 'Check the exercise name here.',
        placement: 'left',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-difficulty"]',
        content: 'Use the difficulty label to choose the right level.',
        placement: 'left',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-description"]',
        content: 'Read the instructions before beginning.',
        placement: 'left',
        skipBeacon: true
      },
      {
        target: '[data-tour="exercise-start-button"]',
        content: 'Press Start exercise to begin.',
        placement: 'top',
        skipBeacon: true
      }
    ],
    []
  )

  useEffect(() => {
    if (!dialogOpen) {
      setDialogTourRun(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setDialogTourRun(true)
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [dialogOpen])

  function handleDialogTourEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setDialogTourRun(false)
    }
  }

  const badge = useMemo(() => {
    switch (props.difficulty) {
      case 'BASIC':
        return <Chip icon={<Whatshot />} label="BASIC" color="warning" />
      case 'INTERMEDIATE':
        return (
          <Chip
            icon={
              <Stack direction="row" useFlexGap sx={{ flexWrap: 'nowrap' }}>
                <Whatshot />
                <Whatshot />
              </Stack>
            }
            label="INTERMEDIATE"
            color="error"
          />
        )
      case 'ADVANCED':
        return (
          <Chip
            color="secondary"
            icon={
              <Stack direction="row" useFlexGap sx={{ flexWrap: 'nowrap' }}>
                <Whatshot />
                <Whatshot />
                <Whatshot />
              </Stack>
            }
            label="ADVANCED"
          />
        )
    }
  }, [props.difficulty])

  return (
    <>
      <Card id={props.htmlId} variant="outlined">
        <CardActionArea onClick={openDialog} disableTouchRipple>
          <CardMedia
            image={props.thumbnailSrc}
            sx={{
              objectFit: 'contain',
              backgroundColor: (t) => t.palette.primary.light,
              aspectRatio: '16/10'
            }}
          />

          <CardHeader
            title={props.name}
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
        </CardActionArea>
      </Card>

      <Dialog maxWidth="lg" open={dialogOpen} onClose={closeDialog}>
        <Joyride
          run={dialogTourRun}
          continuous
          steps={dialogTourSteps}
          onEvent={handleDialogTourEvent}
          options={{
            zIndex: 2000,
            showProgress: true,
            buttons: ['back', 'close', 'skip', 'primary'],
            spotlightPadding: 12,
            backgroundColor: '#111111',
            textColor: '#ffffff',
            primaryColor: '#ffffff',
            arrowColor: '#111111',
            overlayColor: 'rgba(0, 0, 0, 0.48)'
          }}
        />

        <Grid container sx={{ height: '75vh', overflow: 'hidden' }}>
          <Grid
            size={{ lg: 8 }}
            data-tour="exercise-video-preview"
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (t) => t.palette.primary.main
            }}
          >
            <Box
              sx={{
                aspectRatio: '16 / 10',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ReactPlayer controls loop height="100%" width="100%" src={props.videoClipSrc} />
            </Box>
          </Grid>

          <Grid
            size={{ lg: 'grow' }}
            sx={{
              height: '100%',
              overflow: 'auto'
            }}
          >
            <DialogContent>
              <Stack spacing={4}>
                <Stack spacing={2} useFlexGap sx={{ alignItems: 'flex-start' }}>
                  <Button
                    disableTouchRipple
                    variant="text"
                    startIcon={<KeyboardArrowLeftRounded />}
                    onClick={closeDialog}
                  >
                    {`Back`}
                  </Button>

                  <Typography
                    data-tour="exercise-title"
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      borderLeftColor: (t) => t.palette.primary.main,
                      borderLeftStyle: 'solid',
                      borderLeftWidth: 8,
                      paddingLeft: 2,
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}
                  >
                    {props.name}
                  </Typography>

                  <Stack
                    data-tour="exercise-difficulty"
                    direction="row"
                    spacing={1}
                    divider={<Typography color="textSecondary">{`\u2022`}</Typography>}
                    sx={{ flexWrap: 'wrap', alignItems: 'center' }}
                  >
                    {badge}
                  </Stack>
                </Stack>

                <Typography data-tour="exercise-description">{props.explanation}</Typography>

                <Toolbar
                  disableGutters
                  variant="dense"
                  sx={{
                    gap: 1
                  }}
                >
                  <Box component="span" data-tour="exercise-start-button">
                    <StyledRouterLinkButton
                      to="/exercise"
                      search={{ exerciseId: props.exerciseId }}
                      variant="contained"
                      startIcon={<SelfImprovementRounded />}
                      disableTouchRipple
                    >
                      Start exercise
                    </StyledRouterLinkButton>
                  </Box>
                </Toolbar>
              </Stack>
            </DialogContent>
          </Grid>
        </Grid>
      </Dialog>
    </>
  )
}
