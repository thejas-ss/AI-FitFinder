import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center p-6">
      <div className="glass max-w-md p-10 text-center">
        <p className="text-gradient text-7xl font-extrabold">404</p>
        <h1 className="mt-4 text-2xl font-bold">This page doesn&apos;t fit</h1>
        <p className="mt-2 text-white/70">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/home" className="btn-primary mt-6 inline-flex">
          Back home
        </Link>
      </div>
    </main>
  );
}
