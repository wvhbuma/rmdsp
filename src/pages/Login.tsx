import { useAuth } from '@/auth/useAuth'
import { Icon } from '@/layout/icons'

export function Login() {
  const { signIn } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-rm-bg p-8">
      <div className="bg-rm-surface border border-rm-border rounded-lg p-8 w-full max-w-sm text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-es-blue to-es-magenta flex items-center justify-center text-white">
          <Icon name="clock" className="w-7 h-7" />
        </div>
        <h1 className="font-display font-bold text-xl bg-gradient-to-br from-es-blue to-es-magenta bg-clip-text text-transparent mb-1">
          European Sleeper
        </h1>
        <div className="font-body text-[11px] text-rm-gray mb-6">
          Revenue Automation &amp; Management
        </div>
        <p className="font-body text-sm text-rm-gray mb-6">
          Log in met je Microsoft- of Google-account.
        </p>
        <button
          type="button"
          onClick={() => {
            void signIn()
          }}
          className="w-full font-display font-medium text-sm text-white bg-es-blue hover:bg-[#0066dd] transition-colors rounded-md py-2.5 px-4"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}
