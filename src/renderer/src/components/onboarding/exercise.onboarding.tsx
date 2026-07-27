import { useTheme } from "@mui/material/styles";
import { type FC, memo, useMemo } from "react";
import { Joyride, STATUS, type Step } from "react-joyride";

export const Onboarding$Exercise: FC<{
  shouldRun: boolean;
  targets: {
    camera: string;
    timer: string;
    pauseTimerButton: string;
    reopenReferenceVideoButton: string;
  };
  onFinished: () => unknown;
}> = memo((props) => {
  const t = useTheme();

  const steps = useMemo(
    () =>
      [
        {
          target: props.targets.camera,
          content: "This is your live camera view for the exercise.",
          placement: "center",
          skipBeacon: true,
        },
        {
          target: props.targets.timer,
          content:
            "This timer tracks how long the current exercise session has been running.",
          placement: "top",
          skipBeacon: true,
        },
        {
          target: props.targets.pauseTimerButton,
          content: "Use this button to pause or resume the session timer.",
          placement: "top",
          skipBeacon: true,
        },
        {
          target: props.targets.reopenReferenceVideoButton,
          content:
            "The reference exercise video opens in a separate player window. Reopen it here if it was closed.",
          placement: "top",
          skipBeacon: true,
        },
      ] as Step[],
    [props.targets],
  );

  return (
    <Joyride
      scrollToFirstStep
      continuous
      run={props.shouldRun}
      steps={steps}
      onEvent={(event) => {
        if (
          event.status === STATUS.FINISHED ||
          event.status === STATUS.SKIPPED
        ) {
          props.onFinished();
        }
      }}
      options={{
        zIndex: t.zIndex.appBar + 1,
        skipBeacon: true,
        showProgress: true,
        primaryColor: t.palette.primary.main,
      }}
    />
  );
});
