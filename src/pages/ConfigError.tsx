/*
 * Fallback als Entra-config niet compleet is (of MSAL bootstrap crasht).
 * Geen MSAL, geen Router — pure static render zodat nothing else kan falen.
 */
export function ConfigError({ missing }: { missing: string[] }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rm-bg p-8">
      <div className="bg-rm-surface border border-rm-border rounded-lg p-8 w-full max-w-md shadow-sm">
        <div className="font-display font-bold text-xl text-status-error mb-2">
          Configuratie onvolledig
        </div>
        <p className="font-body text-sm text-rm-gray mb-5">
          Deze env-vars ontbreken of zijn leeg. Vul ze in{' '}
          <code className="font-mono text-xs">.env.local</code> (lokaal) of in
          de SWA <strong>Application Settings</strong> (productie).
        </p>
        <ul className="space-y-1 mb-5">
          {missing.map((name) => (
            <li
              key={name}
              className="font-mono text-xs text-rm-dark bg-rm-gray-light px-3 py-1.5 rounded"
            >
              {name}
            </li>
          ))}
        </ul>
        <p className="font-body text-xs text-rm-gray">
          Zie <code className="font-mono">.env.example</code> voor een template.
        </p>
      </div>
    </div>
  )
}
