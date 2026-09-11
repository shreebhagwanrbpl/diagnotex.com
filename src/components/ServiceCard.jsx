import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({
  icon,
  title,
  description,
  badge,
  turnaround,
  highlights = [],
  loading = false,
  makeLink = (p) => p,
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-[#F3B7CB] bg-white p-8 shadow-md">
        <div className="mb-6 h-14 w-14 rounded-2xl bg-[#F9DCE8]" />
        <div className="mb-4 h-7 w-3/4 rounded bg-[#F4CAD9]" />
        <div className="space-y-3">
          <div className="h-4 rounded bg-[#F9DCE8]" />
          <div className="h-4 w-11/12 rounded bg-[#F9DCE8]" />
          <div className="h-4 w-8/12 rounded bg-[#F9DCE8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-[#F3B7CB] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#BE4F78]/50 hover:shadow-2xl hover:shadow-[#BE4F78]/15">
      <div>
        {/* Top bar with Icon & Badge */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9DCE8] text-[#BE4F78] transition-all duration-300 group-hover:bg-[#BE4F78] group-hover:!text-white group-hover:scale-105 shadow-sm [&_svg]:transition-colors [&_svg]:stroke-current group-hover:[&_svg]:!stroke-white group-hover:[&_svg]:!text-white">
            {icon}
          </div>

          {badge && (
            <span className="rounded-full border border-[#BE4F78]/20 bg-[#FCE7EF] px-3 py-1 text-xs font-bold text-[#8F385B]">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-2xl font-bold text-[#3B1830] transition-colors duration-300 group-hover:text-[#BE4F78]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base leading-relaxed text-[#6B5361]">
          {description}
        </p>

        {/* Highlights List if present */}
        {highlights && highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t border-[#F3B7CB]/60 pt-5 text-sm text-[#6B5361]">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#BE4F78] shrink-0" />
                <span className="text-[#6B5361]">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-8 flex items-center justify-between border-t border-[#F3B7CB]/40 pt-4">
        {turnaround ? (
          <span className="text-xs font-semibold text-[#8F385B]">
            SLA: <strong className="text-[#BE4F78] font-bold">{turnaround}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#6B5361]">Certified Quality</span>
        )}

        <Link
          href={makeLink("/contact")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#BE4F78] transition-all group-hover:translate-x-1 hover:text-[#8F385B]"
        >
          <span className="font-bold">Book Service</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}