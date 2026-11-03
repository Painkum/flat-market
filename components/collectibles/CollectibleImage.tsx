import Image from "next/image";
import { cx } from "@/lib/utils/format";

/** Local demo art goes through next/image; remote IPFS art uses a plain img (hosts vary). */
export function CollectibleImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className={cx("flex h-full w-full items-center justify-center bg-line/40", className)}>
        <span className="display text-3xl text-ink-soft">{alt.slice(0, 1)}</span>
      </div>
    );
  }
  if (src.startsWith("/")) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cx("object-cover", className)} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} className={cx("h-full w-full object-cover", className)} />;
}
