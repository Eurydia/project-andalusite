import { useTheme } from "@mui/material/styles";
import { type FC, memo, useMemo } from "react";
import { Joyride, STATUS, type Step } from "react-joyride";

export const Onboarding$ExerciseDialog: FC<{
  shouldRun: boolean;
  targets: {
    videoPreview: string;
    exerciseDescription: string;
    exerciseStart: string;
  };
  onFinished: () => unknown;
}> = memo((props) => {
  const t = useTheme();
  const steps = useMemo(
    () =>
      [
        {
          target: props.targets.videoPreview,
          content: "Preview the exercise movement before starting.",
          skipBeacon: true,
          placement: "center",
          zIndex: t.zIndex.drawer + 200,
        },
        {
          target: props.targets.exerciseDescription,
          content: "Read the instructions before beginning.",
          skipBeacon: true,
          zIndex: t.zIndex.drawer + 200,
        },
        {
          target: props.targets.exerciseStart,
          content: "Start whenever you are ready.",
          skipBeacon: true,
          zIndex: t.zIndex.drawer + 200,
        },
      ] as Step[],
    [t.zIndex.drawer, props.targets],
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
