import { getFaqs } from './microcms'

export const fetchFaqItems = async () => {
  return await getFaqs()
}
