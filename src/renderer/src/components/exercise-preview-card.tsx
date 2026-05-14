import prettyMilliseconds from 'pretty-ms'
import ReactPlayer from 'react-player'
import Whatshot from '@mui/icons-material/Whatshot'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { FC, useCallback, useMemo, useState } from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { StyledRouterLink } from './styled-router-link'
import { Button, Toolbar } from '@mui/material'
import {
  FitnessCenterRounded,
  Flare,
  OpenInNewRounded,
  SelfImprovementRounded
} from '@mui/icons-material'

export const ExercisePreviewCard: FC<{
  name: string
  explanation: string
  thumbnailSrc: string
  videoClipSrc: string
  approxDurationSeconds: number
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  tags: Array<string>
}> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const openDialog = useCallback(() => {
    setDialogOpen(true)
  }, [])
  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const badge = useMemo(() => {
    switch (props.difficulty) {
      case 'BASIC':
        return <Chip icon={<Whatshot />} label="BASIC" color="primary" />
      case 'INTERMEDIATE':
        return (
          <Chip
            icon={
              <Stack direction={'row'} useFlexGap sx={{ flexWrap: 'nowrap' }}>
                <Whatshot />
                <Whatshot />
              </Stack>
            }
            label="INTERMEDIATE"
            color="primary"
          />
        )
      case 'ADVANCED':
        return (
          <Chip
            color="primary"
            icon={
              <Stack direction={'row'} useFlexGap sx={{ flexWrap: 'nowrap' }}>
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
      <Card variant="outlined">
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
                  wordBreak: 'break-word'
                }
              }
            }}
          />
        </CardActionArea>
      </Card>
      <Dialog maxWidth="lg" open={dialogOpen} onClose={closeDialog}>
        <Grid container sx={{ height: '75vh', overflow: 'hidden' }}>
          <Grid
            size={{ lg: 8 }}
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (t) => t.palette.primary.light
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
              <ReactPlayer controls loop height={'100%'} width={'100%'} src={props.videoClipSrc} />
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
                  <Typography
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
                    direction="row"
                    spacing={2}
                    divider={<Typography color="textSecondary">{`\u2022`}</Typography>}
                    sx={{ flexWrap: 'wrap', alignItems: 'center' }}
                  >
                    {badge}
                    <Typography>
                      {`Duration: ~${prettyMilliseconds(props.approxDurationSeconds * 1000)}`}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack spacing={2}>
                  <Typography>{props.explanation}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {props.tags.map((tag) => (
                      <StyledRouterLink key={tag} to=".">
                        {`#${tag}`}
                      </StyledRouterLink>
                    ))}
                  </Stack>
                </Stack>
                <Toolbar
                  disableGutters
                  variant="dense"
                  sx={{
                    gap: 1
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<SelfImprovementRounded />}
                    disableTouchRipple
                  >
                    Start exercise
                  </Button>

                  <Button variant="outlined" startIcon={<OpenInNewRounded />} disableTouchRipple>
                    Learn
                  </Button>
                </Toolbar>
              </Stack>
            </DialogContent>
          </Grid>
        </Grid>
      </Dialog>
    </>
  )
}
