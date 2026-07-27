import KeyboardArrowLeftRounded from "@mui/icons-material/KeyboardArrowLeftRounded";
import SelfImprovementRounded from "@mui/icons-material/SelfImprovementRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { ExerciseData } from "@renderer/types";
import type { FC } from "react";
import Markdown from "react-markdown";
import { DifficultyBadge } from "./difficulty-badge";
import { Onboarding$ExerciseDialog } from "./onboarding/exercise-dialog.onboarding";
import { StyledRouterLinkButton } from "./styled-router-link-button";

export const ExerciseDialog: FC<{
  data: Extract<ExerciseData, { soon?: false | undefined }>;
  open: boolean;
  onClose: () => unknown;
  onboarding: {
    shouldRun: boolean;
    onFinished: () => unknown;
  };
}> = (props) => {
  return (
    <>
      <Onboarding$ExerciseDialog
        targets={{
          exerciseDescription: '[data-onboarding="exercise-description"]',
          videoPreview: '[data-onboarding="video-preview"]',
          exerciseStart: '[data-onboarding="exercise-start"]',
        }}
        shouldRun={props.onboarding.shouldRun && props.open}
        onFinished={props.onboarding.onFinished}
      />
      <Dialog maxWidth="lg" open={props.open} onClose={props.onClose}>
        <Grid container sx={{ height: "75vh", overflow: "hidden" }}>
          <Grid
            size={8}
            data-onboarding="video-preview"
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: (t) => t.palette.primary.main,
            }}
          >
            <Box
              sx={{
                aspectRatio: "16 / 10",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <video
                controls
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  objectFit: "contain",
                  backgroundColor: "transparent",
                  aspectRatio: "16/10",
                }}
              >
                <source src={props.data.videoSrc} type="video/mp4"></source>
              </video>
            </Box>
          </Grid>
          <Grid
            size="grow"
            sx={{
              height: "100%",
              overflow: "auto",
            }}
          >
            <DialogContent>
              <Stack spacing={4}>
                <Stack spacing={2} useFlexGap sx={{ alignItems: "flex-start" }}>
                  <Button
                    disableTouchRipple
                    variant="text"
                    startIcon={<KeyboardArrowLeftRounded />}
                    onClick={props.onClose}
                  >
                    {`Back`}
                  </Button>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      borderLeftColor: (t) => t.palette.primary.main,
                      borderLeftStyle: "solid",
                      borderLeftWidth: 8,
                      paddingLeft: 2,
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    }}
                  >
                    {props.data.name}
                  </Typography>
                  <DifficultyBadge variant={props.data.difficulty} />
                </Stack>

                <Toolbar
                  disableGutters
                  variant="dense"
                  sx={{
                    gap: 1,
                  }}
                >
                  <Box component="span" data-onboarding="exercise-start">
                    <StyledRouterLinkButton
                      to="/exercise"
                      search={{
                        exerciseId: props.data.exerciseId,
                        videoSrc: props.data.videoSrc,
                      }}
                      variant="contained"
                      startIcon={<SelfImprovementRounded />}
                      disableTouchRipple
                    >
                      Start exercise
                    </StyledRouterLinkButton>
                  </Box>
                </Toolbar>
                <Typography
                  data-onboarding="exercise-description"
                  component={"div"}
                >
                  <Markdown>{props.data.explanation}</Markdown>
                </Typography>
              </Stack>
            </DialogContent>
          </Grid>
        </Grid>
      </Dialog>
    </>
  );
};
