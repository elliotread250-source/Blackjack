import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { ProductCard } from "@/components/merch/ProductCard";
import { OrderForm } from "@/components/forms/OrderForm";
import { merch, seo, type ProductId } from "@/content/site";
import { img, type SiteImage } from "@/content/images";

export const metadata: Metadata = {
  title: seo.merch.title,
  description: seo.merch.description,
  alternates: { canonical: "/merch" },
  openGraph: { title: seo.merch.title, description: seo.merch.description, url: "/merch" },
};

export default function MerchPage() {
  return (
    <>
      <PageHero title={merch.heading} intro={merch.intro} image={img("courtTexture")} eyebrow="Personalised player kit" />

      <section aria-labelledby="range-heading" className="py-24 md:py-32">
        <div className="container-x">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionMarker n="01" label="The range" />
              <SplitHeading id="range-heading" text="Your name. Your number." className="mt-6 text-[13vw] leading-[0.88] sm:text-7xl lg:text-[6.5rem]" />
            </div>
            <p className="text-lg text-muted lg:col-span-5">{merch.personalisation}</p>
          </div>
          <div className="mt-14 grid gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-4">
            {merch.products.map((p, i) => (
              <ProductCard key={p.id} product={p} front={img(p.images.front)} back={img(p.images.back)} chart={img(p.images.sizeChart)} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section id="order" aria-labelledby="order-heading" className="scroll-mt-24 border-t border-bone/10 bg-coal py-24 md:py-32">
        <div className="container-x">
          <div className="mb-12 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionMarker n="02" label={merch.howToOrder.heading} />
              <SplitHeading id="order-heading" text={merch.form.heading} className="mt-6 text-[16vw] leading-[0.85] sm:text-8xl lg:text-[8rem]" />
            </div>
            <div className="lg:col-span-5">
              <p className="text-lg">{merch.howToOrder.body}</p>
              <p className="mt-4 inline-flex items-center gap-3 rounded-[8px] border-2 border-orange/60 px-4 py-3 font-bold">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange" aria-hidden>
                  <rect x="3" y="6" width="18" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 10h18M4 4l16 17" stroke="currentColor" strokeWidth="2" />
                </svg>
                {merch.howToOrder.noPayment}
              </p>
            </div>
          </div>
          <OrderForm blanks={Object.fromEntries(merch.products.map((p) => [p.id, img(p.images.blank)])) as Record<ProductId, SiteImage>} />
        </div>
      </section>
    </>
  );
}
