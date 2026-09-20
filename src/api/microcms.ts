export type Faq = {
  id: string
  question: string
  answer: string
}

export const getFaqs = async () => {
  const response = await fetch('/api/faqs')

  if (!response.ok) {
    throw new Error(`FAQ API request failed: ${response.status}`)
  }

  const data = await response.json()

  return [...(data.contents as Faq[])].reverse()
}