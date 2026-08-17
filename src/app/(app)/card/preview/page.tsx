import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CARD_BANDS } from "@/lib/card-bands";
import { BandGallery } from "@/components/card/BandGallery";
import { LangToggle } from "@/components/LangToggle";

export const dynamic = "force-dynamic";

/**
 * The band gallery — all twelve card designs at once.
 *
 * A design tool, not a product screen: it exists so a scene can be judged
 * against its neighbours rather than one score at a time. Admin only, because
 * showing every rung of the ladder to someone standing on the bottom one is
 * not the kind of thing this product does.
 *
 * Each card is labelled with its band name and the file that draws it.
 */
export default async function CardPreviewPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();

  return (
    <main className="px-5 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            DESIGN
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            Card bands
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        Twelve designs, one per Vibe Score band. Each is drawn by its own file
        in <code className="text-[12px]">src/components/card/scenes/</code> —
        edit one without touching the other eleven.
      </p>

      <BandGallery bands={[...CARD_BANDS]} />

      <p className="mt-6 mb-4 text-center text-[12.5px]">
        <Link href="/card" className="font-bold text-coral">
          ← Vibe Card
        </Link>
      </p>
    </main>
  );
}
