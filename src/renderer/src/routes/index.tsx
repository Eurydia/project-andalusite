import { View$MainWindow } from '@renderer/views/media-player-window.view'
import { createFileRoute } from '@tanstack/react-router'
import { default as ReactPlayer } from 'react-player'
import z from 'zod'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  validateSearch: z.object({
    view: z.enum(['MAIN', 'MEDIA_PLAYER'])
  })
})

function RouteComponent() {
  const search = Route.useSearch()
  switch (search.view) {
    case 'MEDIA_PLAYER':
      return <ReactPlayer />
    case 'MAIN':
    default:
      return <View$MainWindow />
  }
}
