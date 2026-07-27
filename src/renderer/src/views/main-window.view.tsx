import InfoOutlineRounded from "@mui/icons-material/InfoOutlineRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import SelfImprovementRounded from "@mui/icons-material/SelfImprovementRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import ViewModuleRounded from "@mui/icons-material/ViewModuleRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  ADVANCED_EXERCISES,
  BASIC_EXERCISES,
  INTERMEDIATE_EXERCISES,
} from "@renderer/assets/exercises";
import { AboutAppDialog } from "@renderer/components/about-app-dialog";
import { ExerciseGroupDisplay } from "@renderer/components/exercise-group-display";
import { Onboarding$Home } from "@renderer/components/onboarding/home.onboarding";
import { SettingsDialog } from "@renderer/components/settings-dialog";
import type { ExerciseData } from "@renderer/types";
import { type FC, useState } from "react";

const matchesSearch = (item: ExerciseData, query: string) => {
  if (query.length === 0) {
    return true;
  }

  const searchText = `${item.name} ${item.difficulty} ${item.soon ? "coming soon" : "ready"}`.toLowerCase();
  return searchText.includes(query);
};

export const View$MainWindow: FC<{
  onboarding: {
    home: {
      shouldRun: boolean;
      onFinished: () => unknown;
    };
    card: {
      shouldRun: boolean;
      onFinished: () => unknown;
    };
  };
}> = (props) => {
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const exerciseSections = [
    {
      id: "basic-exercises",
      idPrefix: "basic",
      eyebrow: "Foundations",
      title: "Basic",
      items: BASIC_EXERCISES.filter((item) =>
        matchesSearch(item, normalizedSearchQuery),
      ),
    },
    {
      id: "intermediate-exercises",
      idPrefix: "intermediate",
      eyebrow: "Build your flow",
      title: "Intermediate",
      items: INTERMEDIATE_EXERCISES.filter((item) =>
        matchesSearch(item, normalizedSearchQuery),
      ),
    },
    {
      id: "advanced-exercises",
      idPrefix: "advanced",
      eyebrow: "Deepen your practice",
      title: "Advanced",
      items: ADVANCED_EXERCISES.filter((item) =>
        matchesSearch(item, normalizedSearchQuery),
      ),
    },
  ];

  const visibleExerciseCount = exerciseSections.reduce(
    (count, section) => count + section.items.length,
    0,
  );

  return (
    <>
      <Onboarding$Home
        shouldRun={props.onboarding.home.shouldRun}
        targets={{
          searchBar: '[data-onboarding="searchbox"]',
          exerciseDisplay: '[data-onboarding="exercise-display"]',
          exerciseCard: '[data-onboarding="basic-0"]',
        }}
        onFinished={props.onboarding.home.onFinished}
      />
      <Box
        sx={{
          height: "100vh",
          display: "grid",
          gridTemplateRows: "56px minmax(0, 1fr)",
          overflow: "hidden",
          backgroundColor: (t) => t.palette.background.default,
        }}
      >
        <AppBar
          component="header"
          position="static"
          sx={{
            color: (t) => t.palette.text.primary,
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
            borderBottomColor: (t) => t.palette.divider,
            backgroundColor: (t) => t.palette.background.paper,
          }}
        >
          <Toolbar
            disableGutters
            variant="dense"
            sx={{
              minHeight: 56,
              paddingInline: 1.5,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 1.5,
                  backgroundColor: (t) => t.palette.primary.main,
                  color: (t) => t.palette.primary.contrastText,
                }}
              >
                <SelfImprovementRounded fontSize="small" />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                YogaCorrect
              </Typography>
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  display: { xs: "none", sm: "block" },
                  marginBlock: 1.25,
                  borderColor: (t) => t.palette.divider,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: { xs: "none", sm: "block" },
                  color: (t) => t.palette.text.secondary,
                }}
              >
                Exercise library
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Tooltip title="About YogaCorrect">
                <IconButton
                  aria-label="About YogaCorrect"
                  size="small"
                  onClick={() => setAboutDialogOpen(true)}
                  sx={{ color: (t) => t.palette.text.secondary }}
                >
                  <InfoOutlineRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton
                  aria-label="Open settings"
                  size="small"
                  onClick={() => setSettingDialogOpen(true)}
                  sx={{
                    color: (t) => t.palette.primary.dark,
                    backgroundColor: (t) => t.palette.primary.light,
                  }}
                >
                  <SettingsRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
            overflow: "hidden",
          }}
        >
          <Stack
            component="aside"
            spacing={2.5}
            sx={{
              display: { xs: "none", md: "flex" },
              minHeight: 0,
              padding: 2,
              borderRightWidth: 1,
              borderRightStyle: "solid",
              borderRightColor: (t) => t.palette.divider,
              backgroundColor: (t) => t.palette.background.paper,
            }}
          >
            <Stack spacing={0.25}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: "0.66rem",
                  color: (t) => t.palette.text.secondary,
                }}
              >
                Practice
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Exercise library
              </Typography>
            </Stack>

            <Stack component="nav" aria-label="Exercise levels" spacing={0.5}>
              <Button
                component="a"
                href="#exercise-library"
                startIcon={<ViewModuleRounded fontSize="small" />}
                sx={{
                  justifyContent: "flex-start",
                  color: (t) => t.palette.primary.contrastText,
                  backgroundColor: (t) => t.palette.primary.main,
                }}
              >
                All exercises
              </Button>
              <Button
                component="a"
                href="#basic-exercises"
                sx={{
                  justifyContent: "space-between",
                  color: (t) => t.palette.text.primary,
                }}
              >
                <span>Basic</span>
                <Typography component="span" variant="caption">
                  {BASIC_EXERCISES.length}
                </Typography>
              </Button>
              <Button
                component="a"
                href="#intermediate-exercises"
                sx={{
                  justifyContent: "space-between",
                  color: (t) => t.palette.text.primary,
                }}
              >
                <span>Intermediate</span>
                <Typography component="span" variant="caption">
                  {INTERMEDIATE_EXERCISES.length}
                </Typography>
              </Button>
              <Button
                component="a"
                href="#advanced-exercises"
                sx={{
                  justifyContent: "space-between",
                  color: (t) => t.palette.text.primary,
                }}
              >
                <span>Advanced</span>
                <Typography component="span" variant="caption">
                  {ADVANCED_EXERCISES.length}
                </Typography>
              </Button>
            </Stack>

            <Divider sx={{ borderColor: (t) => t.palette.divider }} />


            <Box sx={{ flexGrow: 1 }} />


          </Stack>

          <Box
            component="main"
            id="exercise-library"
            sx={{
              minHeight: 0,
              overflowY: "auto",
              scrollBehavior: "smooth",
            }}
          >
            <Stack
              spacing={3}
              sx={{
                width: "100%",
                maxWidth: 1180,
                marginInline: "auto",
                padding: { xs: 2, sm: 2.5, lg: 3 },
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                <Stack spacing={0.4}>
                  <Typography component="h1" variant="h4">
                    Exercise library
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: (t) => t.palette.text.secondary }}
                  >
                    Your practice, aligned. Choose a pose to begin a guided
                    session.
                  </Typography>
                </Stack>

                <Box
                  component="section"
                  data-onboarding="searchbox"
                  sx={{ width: { xs: "100%", sm: 340 } }}
                >
                  <TextField
                    fullWidth
                    type="search"
                    size="small"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search exercises"
                    aria-label="Search exercises"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRounded
                              fontSize="small"
                              sx={{ color: (t) => t.palette.primary.main }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  padding: 2,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: (t) => t.palette.divider,
                  borderRadius: 2,
                  backgroundColor: (t) => t.palette.primary.light,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        borderRadius: 1.5,
                        backgroundColor: (t) => t.palette.primary.main,
                        color: (t) => t.palette.primary.contrastText,
                      }}
                    >
                      <SelfImprovementRounded fontSize="small" />
                    </Box>
                    <Stack spacing={0.1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Ready for a guided session
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: (t) => t.palette.text.secondary }}
                      >
                        Open an available exercise to review instructions and
                        start pose feedback.
                      </Typography>
                    </Stack>
                  </Stack>

                </Stack>
              </Paper>

              <Stack
                spacing={3.5}
                data-onboarding="exercise-display"
              >
                {visibleExerciseCount === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      minHeight: 180,
                      padding: 3,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: (t) => t.palette.divider,
                      borderRadius: 2,
                      backgroundColor: (t) => t.palette.background.paper,
                      textAlign: "center",
                    }}
                  >
                    <Stack spacing={1} sx={{ alignItems: "center" }}>
                      <SearchRounded
                        sx={{
                          fontSize: 32,
                          color: (t) => t.palette.text.secondary,
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        No exercises found
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: (t) => t.palette.text.secondary }}
                      >
                        Try another name, level, or availability term.
                      </Typography>
                    </Stack>
                  </Paper>
                ) : (
                  exerciseSections.map((section) =>
                    section.items.length > 0 ? (
                      <Stack
                        component="section"
                        id={section.id}
                        key={section.id}
                        spacing={1.75}
                        sx={{ scrollMarginTop: 16 }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                          }}
                        >
                          <Stack spacing={0.1}>
                            <Typography
                              variant="overline"
                              sx={{
                                fontSize: "0.65rem",
                                color: (t) => t.palette.secondary.main,
                              }}
                            >
                              {section.eyebrow}
                            </Typography>
                            <Typography component="h2" variant="h5">
                              {section.title}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{ color: (t) => t.palette.text.secondary }}
                          >
                            {section.items.length} exercises
                          </Typography>
                        </Stack>
                        <Divider sx={{ borderColor: (t) => t.palette.divider }} />
                        <ExerciseGroupDisplay
                          idPrefix={section.idPrefix}
                          items={section.items}
                          onboarding={props.onboarding.card}
                        />
                      </Stack>
                    ) : null,
                  )
                )}
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>
      <SettingsDialog
        open={settingDialogOpen}
        onClose={() => setSettingDialogOpen(false)}
      />
      <AboutAppDialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
      />
    </>
  );
};
