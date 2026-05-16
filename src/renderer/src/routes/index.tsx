import { View$MainWindow } from '@renderer/views/main-window.view'
import { createFileRoute } from '@tanstack/react-router'
import { default as ReactPlayer } from 'react-player'
import z from 'zod'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      url: z.string().optional()
    })
    .optional()
})

function RouteComponent() {
  const search = Route.useSearch()
  if (search?.url) {
    return <ReactPlayer controls loop height={'100dvh'} width={'100dvw'} src={search.url} />
  }
  return <View$MainWindow />
}
