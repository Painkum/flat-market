import Link from "next/link";

export default function NotFound() {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="display text-4xl">Page not found</p>
      <Link href="/" className="mt-4 inline-block underline">
        Back to discover
      </Link>
    </div>
  );
}
