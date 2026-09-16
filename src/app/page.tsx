import { TopBar } from '@/components/TopBar'
import { KanbanBoard } from '@/components/KanbanBoard'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <KanbanBoard />
    </div>
  )
}
