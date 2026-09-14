import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const SOURCE_TYPES = [
  'case',
  'legislation',
  'journal',
  'book',
  'report',
  'researchPaper',
  'website',
  'newspaper',
  'otherLegislativeMaterial',
  'internationalMaterial',
  'otherSources',
] as const

const SavePayloadSchema = z.object({
  sourceType: z.enum(SOURCE_TYPES),
  fields: z.record(z.string(), z.unknown()),
  footnoteText: z.string().min(1),
  bibliographyText: z.string().min(1),
  subsequentText: z.string(),
  footnoteHtml: z.string(),
  bibliographyHtml: z.string(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sign in to save citations.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = SavePayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid citation data.' }, { status: 400 })
  }

  const payload = parsed.data

  const { data, error } = await supabase
    .from('citations')
    .insert({
      user_id: user.id,
      source_type: payload.sourceType,
      fields: payload.fields,
      footnote_text: payload.footnoteText,
      bibliography_text: payload.bibliographyText,
      subsequent_text: payload.subsequentText,
      footnote_html: payload.footnoteHtml,
      bibliography_html: payload.bibliographyHtml,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Couldn't save this citation — please try again." }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
