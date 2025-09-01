import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body?.messages || []
    const modelFromClient = body?.model
    const temperatureFromClient = typeof body?.temperature === 'number' ? body.temperature : undefined

    const model = modelFromClient || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
    const temperature = temperatureFromClient ?? 0.6

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
        'X-Title': 'FABARO ALWAYS',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah FABARO ALWAYS, teman curhat yang empatik, suportif, dan menjaga privasi. Beri jawaban singkat, jelas, membantu, dan gunakan bahasa Indonesia yang hangat. Jika ada tanda krisis (bahaya diri/Orang lain), sarankan menghubungi layanan darurat setempat. Jangan memberi nasihat medis/diagnosis.',
          },
          ...messages,
        ],
        temperature,
        top_p: 0.9,
      }),
    })

    if (!resp.ok) {
      const t = await resp.text()
      return new Response(JSON.stringify({ error: t || 'OpenRouter error' }), { status: 500 })
    }

    const json = await resp.json()
    const content = json?.choices?.[0]?.message?.content || ''
    return Response.json({ content })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
}
