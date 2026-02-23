import Link from 'next/link'
import { Activity, Upload, FileText, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Optim Dental AI</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Autentificare</Button>
              </Link>
              <Link href="/signup">
                <Button>Începe acum</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/50 to-white" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
              <Zap className="h-4 w-4" />
              Analiză AI avansată pentru radiografii dentare
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Diagnostic inteligent
              <br />
              <span className="gradient-primary bg-clip-text text-transparent">
                pentru cabinetul tău
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-8">
              Încarcă radiografii dentare și primește un plan de tratament complet cu diagnostic
              odontal, parodontal, protetic și chirurgical — totul alimentat de inteligență
              artificială.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-base">
                  Creează cont gratuit
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base">
                  Am deja cont
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Cum funcționează</h2>
              <p className="mt-4 text-lg text-gray-600">
                Trei pași simpli pentru un diagnostic complet
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Upload,
                  title: '1. Încarcă radiografia',
                  desc: 'Încarcă radiografia panoramică, periapicală sau orice tip de radiografie dentară.',
                },
                {
                  icon: Activity,
                  title: '2. Analiză AI',
                  desc: 'Inteligența artificială analizează imaginea și identifică probleme odontalice, parodontale, protetice și chirurgicale.',
                },
                {
                  icon: FileText,
                  title: '3. Plan de tratament',
                  desc: 'Primești un plan de tratament detaliat, prioritizat și conform cu diagnosticul stabilit.',
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-4">
                    <step.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Caracteristici</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Activity,
                  title: 'Diagnostic odontal',
                  desc: 'Identificare carii, fracturi, leziuni periapicale și alte probleme dentare.',
                },
                {
                  icon: Shield,
                  title: 'Diagnostic parodontal',
                  desc: 'Evaluarea pierderii osoase, buzunarelor parodontale și inflamației gingivale.',
                },
                {
                  icon: FileText,
                  title: 'Plan protetic',
                  desc: 'Recomandări pentru lucrări protetice, implanturi și restaurări.',
                },
                {
                  icon: Zap,
                  title: 'Indicații chirurgicale',
                  desc: 'Identificare situații care necesită intervenție chirurgicală orală.',
                },
                {
                  icon: Users,
                  title: 'Gestiune pacienți',
                  desc: 'Gestionare completă a pacienților cu istoric medical și radiografii.',
                },
                {
                  icon: Shield,
                  title: 'Date securizate',
                  desc: 'Toate datele sunt criptate și stocate conform standardelor GDPR.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-3">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Optim Dental AI Stoma. Toate drepturile rezervate.
        </div>
      </footer>
    </div>
  )
}
