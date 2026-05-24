import { View$MainWindow } from '@renderer/views/main-window.view'
import { createFileRoute } from '@tanstack/react-router'
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
    return (
      <iframe
        src={search.url ?? 'about:blank'}
        width="100vw"
        height="100vh"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ border: 0 }}
      />
    )
  }
  return <View$MainWindow />
}
