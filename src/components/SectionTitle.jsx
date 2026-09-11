export default function SectionTitle({
  badge,
  title,
  description,
  center = false,
  className = "",
}) {
  return (
    <div
      className={`max-w-3xl ${center ? "mx-auto text-center" : ""} ${className}`}
    >
      {badge && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#BE4F78]/25 bg-gradient-to-r from-[#FCE7EF] to-[#F9DCE8] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#8F385B] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#BE4F78] animate-pulse" />
          {badge}
        </div>
      )}

      {title && (
        <h2 className="text-3xl font-extrabold tracking-tight text-[#3B1830] sm:text-4xl md:text-5xl leading-tight">
          {title}
        </h2>
      )}

      {description && (
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#6B5361]">
          {description}
        </p>
      )}
    </div>
  );
}