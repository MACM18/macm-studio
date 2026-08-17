import { StudioSite } from "@/components/studio-site";
import { STRUCTURED_DATA } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <StudioSite />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
    </>
  );
}
