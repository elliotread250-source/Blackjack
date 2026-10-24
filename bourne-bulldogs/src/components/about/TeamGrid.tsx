"use client";

import Image from "next/image";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { TeamMember } from "@/content/site";
import type { SiteImage } from "@/content/images";
import { isFinePointer } from "@/lib/motion-pref";
import { cn } from "@/lib/cn";

function TiltCard({ member, image }: { member: TeamMember; image?: SiteImage }) {
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const glareX = useTransform(ry, [-8, 8], ["0%", "100%"]);
  const glare = useTransform(glareX, (x) => `radial-gradient(circle at ${x} 20%, rgba(255,255,255,.35), transparent 55%)`);
  const willow = member.name === "Willow";

  const move = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !isFinePointer()) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 16);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <m.article
      onPointerMove={move}
      onPointerLeave={leave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn("group relative overflow-hidden rounded-[12px] border bg-coal", willow ? "border-orange/60" : "border-bone/10")}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw"
            placeholder={image.blurDataURL ? "blur" : "empty"}
            blurDataURL={image.blurDataURL}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.07]"
          />
        ) : (
          // Fallback until there's a photo: initials monogram on a court-texture field.
          <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(90deg,#1d1b20_0_22px,#211f24_22px_44px)]">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full text-orange/25" aria-hidden>
              <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M0 100h200" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="display relative grid h-32 w-32 place-items-center rounded-full bg-orange text-6xl text-ink shadow-[0_0_0_8px_rgb(232_103_60/.2)]" aria-hidden>
              {member.initials}
            </span>
            {member.photoTodo && <span className="eyebrow absolute bottom-4 text-[0.65rem] text-muted">{member.photoTodo}</span>}
          </div>
        )}
        <m.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />
        {willow && (
          <span className="display absolute left-3 top-3 -rotate-6 rounded-[6px] bg-orange px-2.5 py-1 text-xl text-ink" aria-hidden>
            Good girl
          </span>
        )}
      </div>
      <div className="p-5 md:p-6">
        <p className="eyebrow text-[0.72rem] text-orange">{member.role}</p>
        <h3 className="display mt-2 text-4xl">{member.name}</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{member.bio}</p>
      </div>
    </m.article>
  );
}

export function TeamGrid({ members }: { members: Array<{ member: TeamMember; image?: SiteImage }> }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {members.map(({ member, image }, i) => (
        <m.li
          key={member.name}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <TiltCard member={member} image={image} />
        </m.li>
      ))}
    </ul>
  );
}
