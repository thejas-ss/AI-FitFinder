export function Footer() {
  return (
    <footer className="mx-auto mt-16 w-[min(1200px,calc(100%-2rem))] pb-8">
      <div className="glass flex flex-col items-center justify-between gap-3 px-6 py-5 text-sm text-white/60 sm:flex-row">
        <p>
          {"© "}
          {new Date().getFullYear()} AI-FitFinder. Measurements are estimates — always check the brand size chart.
        </p>
        <p>Photos are processed securely and never shared.</p>
      </div>
    </footer>
  );
}
