import { createClient } from 'microcms-js-sdk'

export async function GET() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN
  const apiKey = process.env.MICROCMS_API_KEY

  if (!serviceDomain || !apiKey) {
    return Response.json(
      { message: 'microCMS environment variables are not configured.' },
      { status: 500 },
    )
  }

  try {
    const client = createClient({
      serviceDomain,
      apiKey,
    })

    const data = await client.getList({
      endpoint: 'ideco-navi',
    })

    return Response.json(data)
  } catch (error) {
    console.error(error)

    return Response.json({ message: 'Failed to fetch FAQ data.' }, { status: 500 })
  }
}
