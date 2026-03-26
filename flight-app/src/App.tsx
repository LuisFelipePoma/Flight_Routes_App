import CommandLayout from "./layouts/CommandLayout"
import World3dLayout from "./layouts/World3dLayout"

export function App() {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <div className="flex w-full justify-between">
        <CommandLayout />
        <World3dLayout />
      </div>
    </div>
  )
}

export default App
