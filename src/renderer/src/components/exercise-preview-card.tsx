import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded'
import SelfImprovementRounded from '@mui/icons-material/SelfImprovementRounded'
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
import { ExerciseData } from '@renderer/types'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import Markdown from 'react-markdown'
import { StyledRouterLinkButton } from './styled-router-link-button'

export const ExercisePreviewCard: FC<{
  htmlId?: string
  data: ExerciseData
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
  const { data } = props

  const badge = useMemo(() => {
    switch (data.difficulty) {
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
  }, [data.difficulty])

  return (
    <>
      <Card id={props.htmlId} variant="outlined">
        <CardActionArea onClick={openDialog} disableTouchRipple disabled={data.soon}>
          <CardMedia
            image={data.thumbnailSrc}
            sx={{
              objectFit: 'contain',
              backgroundColor: (t) => t.palette.primary.light,
              aspectRatio: '16/10'
            }}
          />
          <CardHeader
            title={`${data.name}${data.soon ? ` (coming soon!)` : ''}`}
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

      {!data.soon && (
        <Dialog maxWidth="lg" open={dialogOpen} onClose={closeDialog} scroll="body">
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
                <iframe
                  src={data.videoSrc}
                  title="YouTube video"
                  width="100%"
                  height="100%"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ border: 0, objectFit: 'contain' }}
                />
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
                      {data.name}
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
                        search={{ exerciseId: data.exerciseId, videoSrc: data.videoSrc }}
                        variant="contained"
                        startIcon={<SelfImprovementRounded />}
                        disableTouchRipple
                      >
                        Start exercise
                      </StyledRouterLinkButton>
                    </Box>
                  </Toolbar>
                  <Typography component={'div'}>
                    <Markdown>{data.explanation}</Markdown>
                  </Typography>
                </Stack>
              </DialogContent>
            </Grid>
          </Grid>
        </Dialog>
      )}
    </>
  )
}
