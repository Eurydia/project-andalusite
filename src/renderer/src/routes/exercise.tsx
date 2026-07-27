import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import KeyboardArrowLeftRounded from "@mui/icons-material/KeyboardArrowLeftRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import VideoLibraryRounded from "@mui/icons-material/VideoLibraryRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Onboarding$Exercise } from "@renderer/components/onboarding/exercise.onboarding";
import { StyledRouterLinkButton } from "@renderer/components/styled-router-link-button";
import { useSynthSoundEffects } from "@renderer/hooks/use-play-feedback-sfx";
import {
  clearPoseOverlay,
  closeCreatedWindow,
  drawPoseOverlay,
  getDownwardDogFeedback,
  getDownwardDogMetrics,
  getPlankFeedback,
  getPlankMetrics,
  getSquatFeedback,
  getSquatMetrics,
  getWebcamStream,
  type Keypoint,
  openCreatedWindow,
  type PoseFeedback,
  stopStream,
  syncOverlayCanvas,
} from "@renderer/util/pose";
import { formatTimer } from "@renderer/util/timer";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Id, toast } from "react-toastify";
import z from "zod";


export const Route = createFileRoute("/exercise")({
  component: RouteComponent,
  validateSearch: z.object({
    videoSrc: z.string(),
    exerciseId: z.string(),
  }),
  loader: async () => {
    let onboardingHasRun = false;

    try {
      onboardingHasRun = await window.persist.get(
        "onboard-exercise-has-run",
        false,
      );
    } catch {
      onboardingHasRun = false;
    }

    return { onboardingHasRun };
  },
});

function RouteComponent() {
  const { onboardingHasRun } = Route.useLoaderData();
  const search = Route.useSearch();
  const { playGood, playBad } = useSynthSoundEffects();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const createdWindowIdRef = useRef<number | undefined>(undefined);
  const closedWindowRef = useRef(false);
  const feedbackToastIdRef = useRef<Id | null>(null);
  const feedbackCodeRef = useRef<string | null>(null);

  const [createdWindowId, setCreatedWindowId] = useState<number | undefined>(
    undefined,
  );
  const [createdWindowOpen, setCreatedWindowOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [stream, setStream] = useState<MediaStream | undefined>(undefined);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  const exerciseKind = useMemo(() => {
    const value = search.exerciseId.toLowerCase();

    if (value.includes("squat")) {
      return "squat";
    }
    if (value.includes("downward-dog")) {
      return "downward-dog";
    }
    return "plank";
  }, [search.exerciseId]);

  const squatMetrics = useMemo(() => {
    if (exerciseKind !== "squat") {
      return null;
    }

    return getSquatMetrics(keypoints);
  }, [exerciseKind, keypoints]);

  const downwardDogMetrics = useMemo(() => {
    if (exerciseKind !== "downward-dog") {
      return null;
    }

    return getDownwardDogMetrics(keypoints);
  }, [exerciseKind, keypoints]);

  const plankMetrics = useMemo(() => {
    if (exerciseKind !== "plank") {
      return null;
    }

    return getPlankMetrics(keypoints);
  }, [exerciseKind, keypoints]);

  const feedback = useMemo<PoseFeedback>(() => {
    switch (exerciseKind) {
      case "downward-dog":
        return getDownwardDogFeedback(keypoints, downwardDogMetrics);
      case "squat":
        return getSquatFeedback(keypoints, squatMetrics);
      default:
        return getPlankFeedback(keypoints, plankMetrics);
    }
  }, [exerciseKind, keypoints, plankMetrics, squatMetrics, downwardDogMetrics]);

  useEffect(() => {
    if (!stream) {
      return;
    }

    if (feedback.kind === "good") {
      if (
        feedbackCodeRef.current !== null &&
        feedbackCodeRef.current !== "good"
      ) {
        void playGood();
      }

      feedbackCodeRef.current = "good";
      if (feedbackToastIdRef.current !== null) {
        toast.update(feedbackToastIdRef.current, {
          type: "success",
          render: "Good!",
        });
      }
      return;
    }

    if (
      feedbackToastIdRef.current === null ||
      !toast.isActive(feedbackToastIdRef.current)
    ) {
      feedbackToastIdRef.current = toast.warning(feedback.message, {
        toastId: "feedback",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        position: "top-right",
      });

      feedbackCodeRef.current = feedback.code;
      void playBad();

      return;
    }

    if (feedbackCodeRef.current !== feedback.code) {
      toast.update(feedbackToastIdRef.current, {
        render: feedback.message,
        type: "warning",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        isLoading: false,
        position: "top-right",
      });

      feedbackCodeRef.current = feedback.code;
      void playBad();
    }
  }, [feedback, playBad, playGood, stream]);

  useEffect(() => {
    createdWindowIdRef.current = createdWindowId;
  }, [createdWindowId]);

  useEffect(() => {
    if (timerPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [timerPaused]);

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;
    let activeStream: MediaStream | undefined;

    void getWebcamStream(abortController.signal)
      .then((nextStream) => {
        activeStream = nextStream;

        if (!active) {
          stopStream(nextStream);
          return;
        }

        setStream(nextStream);
      })
      .catch((error) => {
        if (
          !active ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        setCameraUnavailable(true);
      });

    return () => {
      active = false;
      abortController.abort();
      stopStream(activeStream);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!stream || !video || !canvas) {
      return;
    }

    const frameCanvas = document.createElement("canvas");
    const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });

    frameCanvasRef.current = frameCanvas;
    video.srcObject = stream;

    let active = true;
    let rafId = 0;
    let runningInference = false;

    const syncFrameCanvasSize = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      if (frameCanvas.width !== video.videoWidth) {
        frameCanvas.width = video.videoWidth;
      }

      if (frameCanvas.height !== video.videoHeight) {
        frameCanvas.height = video.videoHeight;
      }

      syncOverlayCanvas(canvas);
    };

    const runFrame = async () => {
      if (!active || !frameCtx) {
        return;
      }

      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      syncFrameCanvasSize();

      frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);

      const imageData = frameCtx.getImageData(
        0,
        0,
        frameCanvas.width,
        frameCanvas.height,
      );

      const result = await window.windowApi.runPoseFrame({
        rgba: imageData.data,
        width: imageData.width,
        height: imageData.height,
      });

      if (!active) {
        return;
      }

      const nextKeypoints = Array.isArray(result) ? result : [];


      setKeypoints(nextKeypoints);

      if (nextKeypoints.length > 0) {
        drawPoseOverlay(canvas, video, nextKeypoints);
      } else {
        clearPoseOverlay(canvas);
      }
    };

    const tick = async () => {
      if (!active) {
        return;
      }

      if (!runningInference && video.readyState >= 2) {
        runningInference = true;

        try {
          await runFrame();
        } catch {
          clearPoseOverlay(canvas);
          setKeypoints([]);
        } finally {
          runningInference = false;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    video.addEventListener("loadedmetadata", syncFrameCanvasSize);
    video.addEventListener("resize", syncFrameCanvasSize);
    window.addEventListener("resize", syncFrameCanvasSize);

    void video.play().then(() => {
      syncFrameCanvasSize();
      tick();
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);

      video.removeEventListener("loadedmetadata", syncFrameCanvasSize);
      video.removeEventListener("resize", syncFrameCanvasSize);
      window.removeEventListener("resize", syncFrameCanvasSize);

      clearPoseOverlay(canvas);

      video.pause();
      video.srcObject = null;

      frameCanvasRef.current = null;
      setKeypoints([]);

      if (feedbackToastIdRef.current !== null) {
        toast.dismiss(feedbackToastIdRef.current);
        feedbackToastIdRef.current = null;
      }

      feedbackCodeRef.current = null;
    };
  }, [stream]);

  useEffect(() => {
    let active = true;

    const createWindowOnEnter = async () => {
      const createdWindow = await openCreatedWindow(search.videoSrc);

      if (!active) {
        closeCreatedWindow(createdWindow.id);
        return;
      }

      closedWindowRef.current = false;
      createdWindowIdRef.current = createdWindow.id;
      setCreatedWindowId(createdWindow.id);
      setCreatedWindowOpen(true);
    };

    void createWindowOnEnter();

    return () => {
      active = false;
    };
  }, [search.videoSrc]);

  useEffect(() => {
    let active = true;

    const syncCreatedWindowOpen = async () => {
      const id = createdWindowIdRef.current;

      if (id === undefined) {
        if (active) {
          setCreatedWindowOpen(false);
        }

        return;
      }

      const result = await window.windowApi.windowExists(id);

      if (active) {
        setCreatedWindowOpen(result.exists);
      }
    };

    void syncCreatedWindowOpen();

    const intervalId = window.setInterval(() => {
      void syncCreatedWindowOpen();
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const closeWindowOnce = () => {
      if (closedWindowRef.current) {
        return;
      }

      closedWindowRef.current = true;
      closeCreatedWindow(createdWindowIdRef.current);
    };

    window.addEventListener("pagehide", closeWindowOnce);
    window.addEventListener("beforeunload", closeWindowOnce);

    return () => {
      window.removeEventListener("pagehide", closeWindowOnce);
      window.removeEventListener("beforeunload", closeWindowOnce);
      closeWindowOnce();
    };
  }, []);

  const [shouldRunOnboarding, setShouldRunOnboarding] = useState(
    !onboardingHasRun,
  );

  useEffect(() => {
    const id = toast.info("Make sure that the room is well lit", {
      position: "top-center",
      autoClose: false,
    });
    return () => {
      toast.dismiss(id);
    };
  }, []);

  return (
    <>
      <Onboarding$Exercise
        shouldRun={shouldRunOnboarding && Boolean(stream)}
        targets={{
          camera: '[data-tour="camera"]',
          timer: '[data-tour="timer"]',
          pauseTimerButton: '[data-tour="timer-btn"]',
          reopenReferenceVideoButton: '[data-tour="ref-btn"]',
        }}
        onFinished={() => {
          setShouldRunOnboarding(false);
          window.persist.set("onboard-exercise-has-run", true);
        }}
      />
      <Box
        sx={{
          height: "100vh",
          overflow: "hidden",
          position: "relative",
          backgroundColor: (t) => t.palette.primary.dark,
        }}
      >
        <Box
          data-tour="camera"
          sx={{
            position: "absolute",
            inset: { xs: 8, sm: 14 },
            overflow: "hidden",
            borderRadius: { xs: 2.5, sm: 4 },
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: (t) =>
              t.alpha(t.palette.primary.contrastText, 0.14),
            backgroundColor: (t) => t.palette.primary.dark,
            boxShadow: (t) => t.shadows[8],
          }}
        >
          {!stream && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                display: "grid",
                placeItems: "center",
                padding: 3,
                textAlign: "center",
              }}
            >
              <Stack spacing={0.75} sx={{ alignItems: "center" }}>
                <Typography
                  variant="h6"
                  sx={{ color: (t) => t.palette.primary.contrastText }}
                >
                  {cameraUnavailable ? "Camera unavailable" : "Starting camera"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 420,
                    color: (t) => t.palette.primary.contrastText,
                    opacity: 0.72,
                  }}
                >
                  {cameraUnavailable
                    ? "Allow camera access in system settings, then reopen this exercise."
                    : "Preparing live pose feedback..."}
                </Typography>
              </Stack>
            </Box>
          )}

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: (t) =>
                `linear-gradient(180deg, ${t.alpha(t.palette.primary.dark, 0.36)} 0%, ${t.alpha(t.palette.primary.dark, 0)} 28%, ${t.alpha(t.palette.primary.dark, 0)} 68%, ${t.alpha(t.palette.primary.dark, 0.5)} 100%)`,
            }}
          />
        </Box>

        <Stack
          spacing={0.25}
          sx={{
            position: "fixed",
            top: { xs: 22, sm: 30 },
            left: { xs: 22, sm: 30 },
            zIndex: 10,
            paddingInline: 2,
            paddingBlock: 1.25,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: (t) =>
              t.alpha(t.palette.primary.contrastText, 0.16),
            borderRadius: 2.5,
            color: (t) => t.palette.primary.contrastText,
            backgroundColor: (t) => t.alpha(t.palette.primary.dark, 0.72),
            backdropFilter: "blur(14px)",
          }}
        >
          <Typography
            variant="overline"
            sx={{
              fontSize: "0.64rem",
              color: (t) => t.palette.primary.contrastText,
              opacity: 0.62,
            }}
          >
            LIVE ALIGNMENT
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ textTransform: "capitalize", letterSpacing: "0.02em" }}
          >
            {search.exerciseId.replaceAll("-", " ")}
          </Typography>
        </Stack>

        <Toolbar
          disableGutters
          variant="dense"
          sx={{
            position: "fixed",
            left: "50%",
            bottom: { xs: 18, sm: 26 },
            transform: "translateX(-50%)",
            zIndex: 10,
            width: { xs: "calc(100% - 32px)", sm: "auto" },
            minWidth: { sm: 620 },
            minHeight: 68,
            justifyContent: "center",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            gap: { xs: 0.5, sm: 1 },
            paddingInline: { xs: 1, sm: 1.5 },
            paddingBlock: 1,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: (t) =>
              t.alpha(t.palette.primary.contrastText, 0.18),
            borderRadius: 999,
            backgroundColor: (t) => t.alpha(t.palette.primary.dark, 0.84),
            color: (t) => t.palette.primary.contrastText,
            backdropFilter: "blur(18px)",
            boxShadow: (t) => t.shadows[16],
          }}
        >
          <Box component="span" data-tour="exercise-back-button">
            <StyledRouterLinkButton
              to="/"
              startIcon={<KeyboardArrowLeftRounded />}
              sx={{
                color: (t) => t.palette.primary.contrastText,
              }}
            >
              Back
            </StyledRouterLinkButton>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: "none", sm: "block" },
              marginBlock: 1,
              borderColor: (t) =>
                t.alpha(t.palette.primary.contrastText, 0.16),
            }}
          />

          <Stack
            data-tour="timer"
            direction="row"
            spacing={1}
            sx={{
              minWidth: 92,
              justifyContent: "center",
              alignItems: "center",
              paddingInline: 1.5,
              color: (t) => t.palette.primary.contrastText,
              opacity: 0.82,
            }}
          >
            <AccessTimeRounded fontSize="small" />
            <Typography
              sx={{
                minWidth: 48,
                fontWeight: 700,
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",
              }}
            >
              {formatTimer(timerSeconds)}
            </Typography>
          </Stack>

          <Button
            data-tour="timer-btn"
            onClick={() => {
              setTimerPaused((value) => !value);
            }}
            startIcon={timerPaused ? <PlayArrowRounded /> : <PauseRounded />}
            sx={{
              color: (t) => t.palette.primary.contrastText,
            }}
          >
            {timerPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            data-tour="ref-btn"
            disabled={createdWindowOpen}
            onClick={async () => {
              const createdWindow = await openCreatedWindow(search.videoSrc);
              closedWindowRef.current = false;
              createdWindowIdRef.current = createdWindow.id;
              setCreatedWindowId(createdWindow.id);
              setCreatedWindowOpen(true);
            }}
            startIcon={<VideoLibraryRounded />}
            sx={{
              color: (t) => t.palette.primary.contrastText,
            }}
          >
            Reopen player
          </Button>
        </Toolbar>
      </Box>
    </>
  );
}
