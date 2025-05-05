import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/serviceid')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/serviceid"!</div>
}
