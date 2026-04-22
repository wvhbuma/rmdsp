export function App() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-display font-bold bg-gradient-to-br from-es-blue to-es-magenta bg-clip-text text-transparent">
        RAM
      </h1>
      <p className="font-body text-sm text-rm-gray">
        European Sleeper Revenue Management
      </p>
      <div className="h-px bg-rm-border" />
      <div className="flex gap-2">
        <span className="text-xs text-rm-gray">Weekly</span>
        <span className="text-xs text-es-blue font-medium">Active</span>
      </div>
    </div>
  )
}
