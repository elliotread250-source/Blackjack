import type { Metadata } from "next";
import { Basketball } from "@/components/fx/Basketball";
import { HoopBack, HoopFront } from "@/components/fx/Hoop";
import { Button } from "@/components/ui/Button";
import { notFound } from "@/content/site";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Airball: the ball clanks off the rim and bounces away. CSS only. */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-32 text-center">
      <div className="relative h-64 w-72" aria-hidden>
        <HoopBack className="absolute left-1/2 top-0 z-10 h-56 w-52 -translate-x-1/2" />
        <div className="clank absolute left-1/2 top-0 z-20 -ml-7 h-14 w-14">
          <Basketball className="h-full w-full" id="airball" />
        </div>
        <HoopFront className="rim-shake absolute left-1/2 top-0 z-30 h-56 w-52 -translate-x-1/2" />
      </div>
      <h1 className="display mt-6 text-[22vw] leading-[0.85] md:text-[11rem]">{notFound.heading}</h1>
      <p className="mt-4 text-xl text-muted">{notFound.body}</p>
      <div className="mt-10">
        <Button href="/">{notFound.button}</Button>
      </div>
      <style>{`
        .clank { animation: clank 2.6s cubic-bezier(.4,0,.6,1) infinite; }
        .rim-shake { animation: rim 2.6s infinite; transform-origin: 50% 56%; }
        @keyframes clank {
          0% { transform: translate(-140px,-90px) rotate(0); opacity: 0; }
          8% { opacity: 1; }
          38% { transform: translate(-26px,86px) rotate(220deg); }
          46% { transform: translate(-70px,20px) rotate(300deg); }
          70% { transform: translate(-150px,190px) rotate(480deg); }
          82% { transform: translate(-190px,150px) rotate(540deg); }
          100% { transform: translate(-240px,200px) rotate(620deg); opacity: 0; }
        }
        @keyframes rim {
          0%, 36%, 52%, 100% { transform: translateX(-50%) rotate(0); }
          40% { transform: translateX(-50%) rotate(-3deg); }
          44% { transform: translateX(-50%) rotate(2deg); }
          48% { transform: translateX(-50%) rotate(-1deg); }
        }
      `}</style>
    </section>
  );
}
