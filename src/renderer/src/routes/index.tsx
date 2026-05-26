import { View$MainWindow } from '@renderer/views/main-window.view'
import { View$VideoWindow } from '@renderer/views/video-window.view'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      url: z.string().optional()
    })
    .optional(),
  loaderDeps: ({ search }) => {
    return { search }
  },
  loader: async ({ deps }) => {
    if (deps.search !== undefined && deps.search.url !== undefined) {
      return { kind: 'VIDEO_PLAYER', url: deps.search.url } as const
    }

    const onboardingHasRun = await window.persist.get('onboard-home-has-run', false)
    const onboardingCardHasRun = await window.persist.get('onboard-card-has-run', false)
    return { kind: 'MAIN', onboardingHasRun, onboardingCardHasRun } as const
  }
})

function RouteComponent() {
  const data = Route.useLoaderData()
  if (data.kind === 'VIDEO_PLAYER') {
    return <View$VideoWindow url={data.url} />
  }
  return (
    <View$MainWindow
      onboarding={{
        home: {
          shouldRun: !data.onboardingHasRun,
          onFinished: () => window.persist.set('onboard-home-has-run', true)
        },
        card: {
          shouldRun: !data.onboardingCardHasRun,
          onFinished: () => window.persist.set('onboard-card-has-run', true)
        }
      }}
    />
  )
}
