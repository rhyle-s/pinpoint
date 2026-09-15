import Checker from '@/components/Checker'

export default function CheckerPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-2xl mx-auto text-center">
        <span className="text-sm font-bold uppercase tracking-[0.08em] text-primary">AGLC4 · 4th edition</span>
        <h1 className="mt-3 text-[2.25rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-[2.5rem]" style={{ textWrap: 'balance' }}>
          Citation Checker
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          Paste a citation you&apos;ve already written and Pinpoint will check it against AGLC4, flag any
          issues, and suggest a fix.
        </p>
      </div>
      <Checker />
    </main>
  )
}
