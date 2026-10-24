import { FlipCard } from "@/components/fx/FlipCard";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Button } from "@/components/ui/Button";
import { home, merch } from "@/content/site";
import { img } from "@/content/images";

export function MerchTeaser() {
  const tee = merch.products.find((p) => p.id === "adult-tee")!;
  const hoody = merch.products.find((p) => p.id === "adult-hoody")!;
  const from = (kind: "tee" | "hoody") =>
    Math.min(...merch.products.filter((p) => p.id.endsWith(kind)).map((p) => p.price));
  const items = [
    { p: tee, title: "Player T-Shirt", price: from("tee") },
    { p: hoody, title: "Player Hoody", price: from("hoody") },
  ];
  return (
    <section aria-labelledby="merch-heading" className="relative py-24 md:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <SectionMarker n="07" label="Club merch" />
          <SplitHeading id="merch-heading" text={home.merchHeading} className="mt-6 text-[17vw] leading-[0.85] sm:text-8xl lg:text-[7.5rem]" />
          <p className="mt-6 max-w-sm text-muted">{home.merchSub}</p>
          <div className="mt-8">
            <Button href="/merch">{home.merchCta}</Button>
          </div>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
          {items.map(({ p, title, price }, i) => (
            <li key={p.id} className={i === 1 ? "sm:mt-16" : ""}>
              <FlipCard front={img(p.images.front)} back={img(p.images.back)} label={title} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
              <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-bone/10 pb-4">
                <h3 className="display text-3xl">{title}</h3>
                <p className="display text-3xl text-orange">
                  <span className="mr-1 font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted">from</span>£{price}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
