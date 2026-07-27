import KeyboardArrowLeftRounded from "@mui/icons-material/KeyboardArrowLeftRounded";
import SelfImprovementRounded from "@mui/icons-material/SelfImprovementRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ExerciseData } from "@renderer/types";
import type { FC, ReactNode } from "react";
import Markdown from "react-markdown";
import { DifficultyBadge } from "./difficulty-badge";
import { Onboarding$ExerciseDialog } from "./onboarding/exercise-dialog.onboarding";
import { StyledRouterLinkButton } from "./styled-router-link-button";

type InstructionHeadingProps = {
  component: "h1" | "h2" | "h3" | "h4";
  fontSize: string;
  children: ReactNode;
};

const InstructionHeading: FC<InstructionHeadingProps> = (props) => (
  <Typography
    component={props.component}
    sx={{
      marginTop: 3.5,
      marginBottom: 1.5,
      color: (t) => t.palette.text.primary,
      fontWeight: 400,
      lineHeight: 1.2,
      fontSize: props.fontSize,
    }}
  >
    {props.children}
  </Typography>
);

const InstructionList: FC<{
  component: "ol" | "ul";
  children: ReactNode;
}> = (props) => (
  <Box
    component={props.component}
    sx={{
      paddingLeft: 2.75,
      marginBlock: 1.5,
    }}
  >
    {props.children}
  </Box>
);

const ExerciseInstructions: FC<{ children: string }> = (props) => (
  <Box sx={{ color: (t) => t.palette.text.secondary }}>
    <Markdown
      components={{
        h1: ({ children }) => (
          <InstructionHeading component="h1" fontSize="1.8rem">
            {children}
          </InstructionHeading>
        ),
        h2: ({ children }) => (
          <InstructionHeading component="h2" fontSize="1.5rem">
            {children}
          </InstructionHeading>
        ),
        h3: ({ children }) => (
          <InstructionHeading component="h3" fontSize="1.25rem">
            {children}
          </InstructionHeading>
        ),
        h4: ({ children }) => (
          <InstructionHeading component="h4" fontSize="1.25rem">
            {children}
          </InstructionHeading>
        ),
        p: ({ children }) => (
          <Typography
            component="p"
            sx={{ marginBlock: 1.5, lineHeight: 1.75 }}
          >
            {children}
          </Typography>
        ),
        ol: ({ children }) => (
          <InstructionList component="ol">{children}</InstructionList>
        ),
        ul: ({ children }) => (
          <InstructionList component="ul">{children}</InstructionList>
        ),
        li: ({ children }) => (
          <Box component="li" sx={{ marginBottom: 0.75, paddingLeft: 0.5 }}>
            {children}
          </Box>
        ),
        strong: ({ children }) => (
          <Box
            component="strong"
            sx={{ color: (t) => t.palette.text.primary }}
          >
            {children}
          </Box>
        ),
      }}
    >
      {props.children}
    </Markdown>
  </Box>
);

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
      <Dialog
        fullWidth
        maxWidth="xl"
        open={props.open}
        onClose={props.onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "calc(100% - 24px)", md: "calc(100% - 64px)" },
              maxHeight: { xs: "calc(100% - 24px)", md: "88vh" },
              overflow: "hidden",
            },
          },
        }}
      >
        <Grid
          container
          sx={{
            minHeight: { xs: 0, md: 620 },
            height: { xs: "auto", md: "82vh" },
            maxHeight: { xs: "calc(100vh - 24px)", md: 760 },
            overflow: { xs: "auto", md: "hidden" },
          }}
        >
          <Grid
            size={{ xs: 12, md: 7 }}
            data-onboarding="video-preview"
            sx={{
              position: "relative",
              minHeight: { xs: 300, sm: 390, md: "100%" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundColor: (t) => t.palette.primary.dark,
              backgroundImage: (t) =>
                `radial-gradient(circle at 15% 20%, ${t.alpha(t.palette.secondary.main, 0.26)}, ${t.alpha(t.palette.secondary.main, 0)} 28%), radial-gradient(circle at 90% 85%, ${t.alpha(t.palette.primary.light, 0.13)}, ${t.alpha(t.palette.primary.light, 0)} 32%)`,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                position: "absolute",
                top: 24,
                left: 28,
                zIndex: 1,
                color: (t) => t.palette.primary.contrastText,
                opacity: 0.68,
              }}
            >
              MOVEMENT PREVIEW
            </Typography>
            <Box
              sx={{
                width: "100%",
                aspectRatio: "16 / 10",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: { xs: 2, md: 4 },
              }}
            >
              <video
                controls
                width="100%"
                height="100%"
                style={{
                  borderWidth: 0,
                  display: "block",
                  objectFit: "contain",
                  aspectRatio: "16/10",
                  borderRadius: 20,
                }}
              >
                <source src={props.data.videoSrc} type="video/mp4"></source>
              </video>
            </Box>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              height: { xs: "auto", md: "100%" },
              overflow: { xs: "visible", md: "auto" },
              backgroundColor: (t) => t.palette.background.paper,
            }}
          >
            <DialogContent sx={{ padding: { xs: 3, sm: 4, md: 5 } }}>
              <Stack spacing={4}>
                <Stack spacing={2.5} sx={{ alignItems: "flex-start" }}>
                  <Button
                    disableTouchRipple
                    variant="text"
                    startIcon={<KeyboardArrowLeftRounded />}
                    onClick={props.onClose}
                    sx={{ marginLeft: -2 }}
                  >
                    Back
                  </Button>
                  <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Typography
                      variant="overline"
                      sx={{ color: (t) => t.palette.secondary.main }}
                    >
                      GUIDED PRACTICE
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: "2.6rem", md: "3.5rem" },
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {props.data.name}
                    </Typography>
                    <DifficultyBadge variant={props.data.difficulty} />
                  </Stack>
                </Stack>

                <Box
                  component="span"
                  data-onboarding="exercise-start"
                  sx={{ display: "block" }}
                >
                  <StyledRouterLinkButton
                    fullWidth
                    size="large"
                    to="/exercise"
                    search={{
                      exerciseId: props.data.exerciseId,
                      videoSrc: props.data.videoSrc,
                    }}
                    variant="contained"
                    startIcon={<SelfImprovementRounded />}
                    disableTouchRipple
                    sx={{ minHeight: 52 }}
                  >
                    Start exercise
                  </StyledRouterLinkButton>
                </Box>

                <Box data-onboarding="exercise-description">
                  <ExerciseInstructions>
                    {props.data.explanation}
                  </ExerciseInstructions>
                </Box>
              </Stack>
            </DialogContent>
          </Grid>
        </Grid>
      </Dialog>
    </>
  );
};
