import { GOOGLE_TAG_ID } from "@/lib/analytics";

export function GoogleAnalytics() {
  if (!/^GT-[A-Z0-9]+$/.test(GOOGLE_TAG_ID)) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
        `,
        }}
      />
    </>
  );
}
