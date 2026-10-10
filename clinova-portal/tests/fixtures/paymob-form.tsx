import { createRoot } from 'react-dom/client'
import { PaymobConnectionForm } from '../../src/components/paymob/connection-form'
import { SetupScreenshot } from '../../src/components/paymob/setup-screenshot'
import type { PaymobCredentials } from '../../src/components/paymob/credentials'
import '../../src/i18n'
import '../../src/App.css'

// Browser-test-only adapters; never imported by the production application.
function save(changes: Partial<PaymobCredentials>) {
  // Emit only names and a boolean assertion, never submitted credential values.
  window.dispatchEvent(new CustomEvent('submitted-fields', { detail: { names: Object.keys(changes), correctApiKey: changes.apiKey === 'test-new-api-only' } }))
  return new Promise<void>((resolve, reject) => {
    window.addEventListener('save-result', (event) => {
      if ((event as CustomEvent<string>).detail === 'success') resolve()
      else reject(new Error('RAW_PROVIDER_ERROR_SECRET'))
    }, { once: true })
  })
}
const mode = new URLSearchParams(location.search).get('mode')
const existing = { accountId: 12, status: 'Ready' as const, isReady: true, integrations: [], storedFields: { publicKey: true, secretKey: true, hmacSecret: true, apiKey: true, cardIntegrationId: true }, cardIntegrationId: '5934907' }
createRoot(document.getElementById('root')!).render(mode === 'update'
  ? <PaymobConnectionForm mode="update" existing={existing} onUpdate={save} />
  : mode === 'image' ? <SetupScreenshot section="Supplied image test" src="/src/assets/logo.svg" />
  : <PaymobConnectionForm onConnect={save} />)
