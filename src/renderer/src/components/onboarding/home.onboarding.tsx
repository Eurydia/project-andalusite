import { useTheme } from "@mui/material/styles";
import { type FC, memo, useMemo } from "react";
import { Joyride, STATUS, type Step } from "react-joyride";

export const Onboarding$Home: FC<{
  shouldRun: boolean;
  targets: {
    searchBar: string;
    exerciseDisplay: string;
    exerciseCard: string;
  };
  onFinished: () => unknown;
}> = memo((props) => {
  const t = useTheme();
  const steps = useMemo(
    () =>
      [
        {
          target: props.targets.searchBar,
          content: "Search exercises by name, tag, difficulty, or duration.",
          placement: "bottom",
          skipBeacon: true,
        },
        {
          target: props.targets.exerciseDisplay,
          content: `Here's a list of exercises.`,
          placement: "top",
          skipBeacon: true,
        },
        {
          target: props.targets.exerciseCard,
          content: "Click an exercise to open its preview.",
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
