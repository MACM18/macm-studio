import { StudioSite } from "@/components/studio-site";
import { GoogleAnalytics } from "@/components/google-analytics";
import { STRUCTURED_DATA } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <GoogleAnalytics />
      <StudioSite />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
    </>
  );
}
