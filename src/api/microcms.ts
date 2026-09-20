import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.VITE_MICROCMS_API_KEY,
});

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export const getFaqs = async () => {
  const data = await client.get({
    endpoint: "ideco-navi",
  });

  return [...(data.contents as Faq[])].reverse();
};
