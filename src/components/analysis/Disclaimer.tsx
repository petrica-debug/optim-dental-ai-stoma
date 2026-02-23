import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Avertisment</p>
          <p>
            Acest instrument utilizează inteligență artificială pentru a genera sugestii
            informative și educative bazate pe analiza radiografiilor dentare. Rezultatele{' '}
            <strong>NU</strong> constituie un diagnostic medical și <strong>NU</strong> înlocuiesc
            evaluarea clinică profesională a medicului stomatolog. Medicul dentist are
            responsabilitatea finală și exclusivă pentru stabilirea diagnosticului și a planului de
            tratament.
          </p>
        </div>
      </div>
    </div>
  )
}
