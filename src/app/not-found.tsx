import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-sea">Page not found</h1>
      <Link className="btn mt-6" href="/">
        Back to the guide
      </Link>
    </div>
  );
}
