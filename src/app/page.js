"use client";
import { db, doc, getDoc, getCachedDoc } from "@/lib/client-api";
import { fetchAllDynamicProducts, getCachedProducts } from "@/lib/fetchProducts";
import { fallbackServices } from "@/data/servicesData";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Mail,
  Wrench,
  Activity,
  Award,
  Clock,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";

import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import ProductCard from "@/components/ProductCard";
import ContactForm from "@/components/ContactForm";
import HeroCarousel from "@/components/HeroCarousel";

const stats = [
  {
    number: "5,000+",
    title: "Healthcare Partners",
    desc: "Hospitals & labs served nationwide",
    icon: Building2,
  },
  {
    number: "3,500+",
    title: "Products & Kits",
    desc: "Precision diagnostic instruments",
    icon: Microscope,
  },
  {
    number: "10+ Yrs",
    title: "Engineering Excellence",
    desc: "Proven biomedical leadership",
    icon: ShieldCheck,
  },
  {
    number: "99.9%",
    title: "Accuracy SLA",
    desc: "NABL & ISO certified standards",
    icon: Award,
  },
];

const pillars = [
  {
    title: "Certified Calibration Standards",
    desc: "Every diagnostic analyzer undergoes NABL-traceable calibration to ensure precise patient diagnostics and regulatory safety.",
    icon: Award,
    badge: "ISO 13485 Certified",
  },
  {
    title: "24/7 Emergency AMC Response",
    desc: "Our nationwide team of biomedical engineers delivers rapid on-site maintenance to keep critical ICU and OT gear active.",
    icon: Zap,
    badge: "2-Hour SLA",
  },
  {
    title: "Turnkey Lab Setup & Engineering",
    desc: "From architectural workflow layout to instrument installation and staff certification, we engineer complete pathology labs.",
    icon: Building2,
    badge: "Turnkey Engineering",
  },
  {
    title: "Cold-Chain Reagent Supply",
    desc: "Strictly temperature-monitored distribution of biochemistry reagents, controls, and rapid assay kits with extended shelf life.",
    icon: FlaskConical,
    badge: "Monitored Cold Chain",
  },
];

const testimonials = [
  {
    quote:
      "Raj Biosis transformed our central laboratory setup. Their automated analyzers increased our daily sample throughput by 40% with zero downtime.",
    author: "Dr. Arvind Sharma",
    role: "Chief Pathologist",
    institution: "Apollo Diagnostics Center",
    rating: 5,
  },
  {
    quote:
      "The 24/7 AMC response team is outstanding. When our ICU patient monitor system faced a sensor issue, their engineer arrived within 90 minutes.",
    author: "Dr. Meenakshi Sundaram",
    role: "Medical Director",
    institution: "Metro Multispecialty Hospital",
    rating: 5,
  },
  {
    quote:
      "Their cold-chain reagent delivery has never failed us. Quality control results are consistently accurate, month after month.",
    author: "Rajesh Varma",
    role: "Laboratory Operations Manager",
    institution: "LifeCare PathLabs",
    rating: 5,
  },
];

export default function Home({ city }) {
  // ============================================================
  // DYNAMIC DATA (Instant 0ms initialization from cache/fallback)
  // ============================================================
  const [services, setServices] = useState(() => {
    const cached = getCachedDoc(doc(db, "websites", "diagnotexcom", "pages", "services"));
    if (cached && Array.isArray(cached.services) && cached.services.length > 0) {
      return cached.services;
    }
    return fallbackServices;
  });
  const [products, setProducts] = useState(() => getCachedProducts() || []);
  const [contactInfo, setContactInfo] = useState(() => {
    const cached = getCachedDoc(doc(db, "websites", "diagnotexcom", "pages", "contact"));
    return cached?.contactInfo || [];
  });
  const [loading, setLoading] = useState(() => {
    const hasProducts = (getCachedProducts() || []).length > 0;
    return !hasProducts;
  });

  // ============================================================
  // PATH / DISTRICT
  // ============================================================
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);

  const staticRoutes = ["about", "services", "items", "contact"];

  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const locationTitle =
    city || (district ? district.replace(/-/g, " ") : "");

  // ============================================================
  // DYNAMIC LINK
  // ============================================================
  const makeLink = (path) => {
    if (!district) return path;

    if (path === "/") {
      return `/${district}`;
    }

    return `/${district}${path}`;
  };

  // ============================================================
  // FETCH DATA (Parallel fast SWR fetch)
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [contactRes, serviceRes, productRes] = await Promise.allSettled([
          getDoc(doc(db, "websites", "diagnotexcom", "pages", "contact")),
          getDoc(doc(db, "websites", "diagnotexcom", "pages", "services")),
          fetchAllDynamicProducts(),
        ]);

        if (!isMounted) return;

        // Contact Info
        if (contactRes.status === "fulfilled" && contactRes.value?.exists()) {
          const info = contactRes.value.data()?.contactInfo;
          if (Array.isArray(info)) {
            setContactInfo(info);
          }
        }

        // Services
        if (serviceRes.status === "fulfilled" && serviceRes.value?.exists()) {
          const rawServices = serviceRes.value.data()?.services;
          if (Array.isArray(rawServices) && rawServices.length > 0) {
            const dbServices = rawServices
              .map((service, index) => ({
                id: service?.id || `service-${index}`,
                title: typeof service?.title === "string" ? service.title.trim() : "",
                desc: typeof service?.desc === "string" ? service.desc.trim() : "",
              }))
              .filter((service) => service.title && service.desc);

            if (dbServices.length > 0) {
              setServices(dbServices);
            }
          }
        }

        // Products
        if (productRes.status === "fulfilled" && Array.isArray(productRes.value)) {
          setProducts(productRes.value);
        }
      } catch (err) {
        console.error("Error fetching dynamic data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredProducts = products.slice(0, 3);

  // ============================================================
  // SERVICE ICONS
  // Icons are static, content is dynamic
  // ============================================================
  const serviceIcons = [
    <Microscope size={28} key={1} />,
    <Building2 size={28} key={2} />,
    <Wrench size={28} key={3} />,
    <FlaskConical size={28} key={4} />,
    <Stethoscope size={28} key={5} />,
    <Award size={28} key={6} />,
  ];

  // ============================================================
  // DYNAMIC PHONE
  // ============================================================
  const helplinePhone = (() => {
    const item = contactInfo.find(
      (c) =>
        c?.label
          ?.toLowerCase()
          .includes("phone") ||
        c?.label
          ?.toLowerCase()
          .includes("mobile") ||
        c?.label
          ?.toLowerCase()
          .includes("helpline") ||
        c?.label
          ?.toLowerCase()
          .includes("contact")
    );

    if (!item) return "";

    if (Array.isArray(item.value)) {
      return item.value[0] || "";
    }

    return typeof item.value === "string"
      ? item.value.trim()
      : "";
  })();

  // ============================================================
  // DYNAMIC EMAIL
  // ============================================================
  const supportEmail = (() => {
    const item = contactInfo.find(
      (c) =>
        c?.label
          ?.toLowerCase()
          .includes("email") ||
        c?.label
          ?.toLowerCase()
          .includes("mail")
    );

    if (!item) return "";

    if (Array.isArray(item.value)) {
      return item.value[0] || "";
    }

    return typeof item.value === "string"
      ? item.value.trim()
      : "";
  })();

  return (
    <div className="bg-[#FFF7FA]/40 text-[#3B1830]">

      {/* ================= DYNAMIC HERO BANNER & CAROUSEL ================= */}
      <HeroCarousel
        locationTitle={locationTitle}
        makeLink={makeLink}
      />

      {/* ================= STATS TICKER ================= */}
      <section
        data-dark="true"
        className="stats-section bg-gradient-to-r from-[#3B1830] via-[#6B5361] to-[#3B1830] py-10 text-white shadow-inner"
      >
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((item, idx) => {
              const Icon = item.icon;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#BE4F78]/25 text-[#E9AFC4] border border-[#BE4F78]/40">
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight !text-white">
                      {item.number}
                    </h3>

                    <p className="text-xs sm:text-sm font-bold !text-[#E9AFC4]">
                      {item.title}
                    </p>

                    <p className="text-[11px] !text-[#F3B7CB]/80 hidden sm:block">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PILLARS / WHY CHOOSE US ================= */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FFF7FA] to-[#FCE7EF]">
        <div className="container-custom">
          <SectionTitle
            badge="Why Modern Labs Choose Us"
            title="Precision with a Human Touch"
            description="A softer premium healthcare interface focused on trust and human connection."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <div
                  key={index}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[#F3B7CB] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#BE4F78]/50 hover:shadow-2xl hover:shadow-[#BE4F78]/15"
                >
                  <div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9DCE8] text-[#BE4F78] transition-all duration-300 group-hover:bg-[#BE4F78] group-hover:!text-white group-hover:scale-110 shadow-sm [&_svg]:transition-colors [&_svg]:stroke-current group-hover:[&_svg]:!stroke-white group-hover:[&_svg]:!text-white">
                      <Icon size={28} />
                    </div>

                    <span className="mb-3 inline-block rounded-full bg-[#FFF7FA] border border-[#F3B7CB] px-3 py-1 text-xs font-bold text-[#8F385B]">
                      {pillar.badge}
                    </span>

                    <h3 className="mb-3 text-xl font-bold text-[#3B1830] group-hover:text-[#BE4F78] transition-colors">
                      {pillar.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[#6B5361]">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#F3B7CB]/40 flex items-center gap-2 text-xs font-bold text-[#BE4F78]">
                    <span>Learn standard</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS SHOWCASE ================= */}
      <section className="section-padding bg-white border-y border-[#F3B7CB]/50">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionTitle
              badge="Diagnostic Inventory"
              title="Equipment Worth Exploring"
              description="Explore our curated catalog of automated clinical analyzers, PCR units, ICU patient monitors, and laboratory centrifuges."
            />

            <Link
              href={makeLink("/items")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FFF7FA] border border-[#F3B7CB] px-6 py-3.5 text-sm font-bold text-[#BE4F78] shadow-sm transition-all hover:bg-[#BE4F78] hover:!text-white hover:border-[#BE4F78] shrink-0 group/all"
            >
              <span className="group-hover/all:!text-white font-bold">
                View All Products
              </span>

              <ArrowRight
                size={16}
                className="group-hover/all:!text-white"
              />
            </Link>
          </div>

          {/* Product Grid — exactly 3 dynamic products */}
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                makeLink={makeLink}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES MATRIX ================= */}
      <section className="section-padding bg-gradient-to-b from-[#FCE7EF] via-white to-[#FFF7FA]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionTitle
              badge="Healthcare Solutions"
              title="Support Built Around Your Workflow"
              description="From NABL-certified calibration to 2-hour emergency repair response, our certified engineers support your clinical operations round the clock."
            />

            <Link
              href={makeLink("/services")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FFF7FA] border border-[#F3B7CB] px-6 py-3.5 text-sm font-bold text-[#BE4F78] shadow-sm transition-all hover:bg-[#BE4F78] hover:!text-white hover:border-[#BE4F78] shrink-0 group/all"
            >
              <span className="group-hover/all:!text-white font-bold">
                View All Services
              </span>
              <ArrowRight
                size={16}
                className="group-hover/all:!text-white"
              />
            </Link>
          </div>

          {/* ====================================================
              SERVICES CARDS (Exactly 3 cards)
          ==================================================== */}
          {loading && services.length === 0 ? (
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-[#F3B7CB] bg-white p-8 shadow-sm animate-pulse"
                >
                  <div className="h-14 w-14 rounded-2xl bg-[#F3B7CB]/30" />
                  <div className="mt-6 h-6 w-3/4 rounded bg-[#F3B7CB]/30" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full rounded bg-[#F3B7CB]/30" />
                    <div className="h-4 w-5/6 rounded bg-[#F3B7CB]/30" />
                    <div className="h-4 w-2/3 rounded bg-[#F3B7CB]/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 3).map((srv, idx) => (
                <ServiceCard
                  key={srv.id || idx}
                  icon={
                    serviceIcons[
                      idx % serviceIcons.length
                    ]
                  }
                  title={srv.title}
                  description={srv.desc}
                  makeLink={makeLink}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex justify-center">
              <div className="w-full max-w-2xl rounded-3xl border border-[#F3B7CB] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7FA] text-[#BE4F78]">
                  <Wrench size={30} />
                </div>
                <h3 className="mt-6 text-2xl font-black text-[#3B1830]">
                  No Services Available
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6B5361]">
                  Our service catalog is currently being updated. Please contact our team for available biomedical support services.
                </p>
                <Link
                  href={makeLink("/contact")}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#BE4F78] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#8F385B] hover:-translate-y-0.5"
                >
                  Contact Our Team
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= ISO & QUALITY CERTIFICATION BANNER ================= */}
      <section className="section-padding bg-[#3B1830] text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#BE4F78]/20 blur-3xl" />

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-7">

              <span className="inline-flex items-center gap-2 rounded-full bg-[#BE4F78]/30 border border-[#BE4F78]/50 px-4 py-1.5 text-xs font-bold text-[#E9AFC4] uppercase tracking-wider">
                <Award size={16} />
                Quality Assurance & Compliance
              </span>

              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Uncompromised Clinical Accuracy & Regulatory Standards
              </h2>

              <p className="mt-4 text-base sm:text-lg text-[#F3B7CB]/90 leading-relaxed">
                Raj Biosisstrictly adheres to international quality protocols. Every equipment installation comes with complete IQ/OQ/PQ validation documentation and certified calibration reports.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">

                <div className="rounded-2xl border border-[#F3B7CB]/20 bg-white/5 p-5 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck
                      size={20}
                      className="text-[#BE4F78]"
                    />
                    ISO 13485 & CE Compliance
                  </h4>

                  <p className="mt-2 text-xs text-[#F3B7CB]/80">
                    Certified medical device quality management system for diagnostic analyzers.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#F3B7CB]/20 bg-white/5 p-5 backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock
                      size={20}
                      className="text-[#BE4F78]"
                    />
                    2-Hour SLA Maintenance
                  </h4>

                  <p className="mt-2 text-xs text-[#F3B7CB]/80">
                    Dedicated engineer dispatch team ready for emergency hospital repairs.
                  </p>
                </div>

              </div>
            </div>

            <div className="lg:col-span-5">

              <div className="rounded-3xl border border-[#F3B7CB]/30 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-md text-center">

                <div className="mx-auto flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#D9688D] via-[#BE4F78] to-[#8F385B] text-white shadow-2xl shadow-[#BE4F78]/50 border-2 border-pink-300/40 p-2">

                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                    100%
                  </span>

                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FCE7EF] mt-1">
                    Certified
                  </span>

                </div>

                <h3 className="mt-6 text-2xl font-bold text-white">
                  Compliance Guarantee
                </h3>

                <p className="mt-3 text-sm text-[#F3B7CB] leading-relaxed">
                  All instruments tested with traceable reference standards before dispatch to your medical facility.
                </p>

                <Link
                  href={makeLink("/contact")}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#BE4F78] !text-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-[#BE4F78]/40 transition-all hover:bg-[#D9688D] hover:shadow-2xl hover:-translate-y-0.5 border border-pink-400/30"
                >
                  <span className="!text-white font-bold">
                    Request Inspection Certificate
                  </span>

                  <ArrowRight
                    size={16}
                    className="!text-white"
                  />
                </Link>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="section-padding bg-gradient-to-b from-white via-[#FFF7FA] to-[#FCE7EF]">
        <div className="container-custom">

          <SectionTitle
            badge="What Our Partners Say"
            title="Chosen by Diagnostic Teams"
            description="Read how healthcare professionals rely onRaj Biosisfor accurate diagnostics and uninterrupted equipment uptime."
            center
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-3">

            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-[#F3B7CB] bg-white p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >

                <div>

                  <div className="flex gap-1 text-[#BE4F78] mb-4">
                    {Array.from({
                      length: t.rating,
                    }).map((_, i) => (
                      <span key={i}>
                        ★
                      </span>
                    ))}
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed text-[#6B5361] italic">
                    "{t.quote}"
                  </p>

                </div>

                <div className="mt-8 border-t border-[#F3B7CB]/60 pt-4 flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9DCE8] text-[#BE4F78] font-bold text-lg">
                    {t.author.charAt(4) || "D"}
                  </div>

                  <div>

                    <h4 className="text-base font-bold text-[#3B1830]">
                      {t.author}
                    </h4>

                    <p className="text-xs text-[#6B5361]">
                      {t.role} —{" "}
                      <span className="text-[#BE4F78] font-medium">
                        {t.institution}
                      </span>
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ================= QUICK INQUIRY FORM SECTION ================= */}
      <section className="section-padding bg-gradient-to-br from-[#FCE7EF] via-white to-[#F9DCE8] border-t border-[#F3B7CB]">
        <div className="container-custom">

          <div className="grid lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-5">

              <SectionTitle
                badge="Direct Consultation"
                title="Planning a Purchase or Need Technical Guidance?"
                description="Our biomedical engineering consultants will analyze your laboratory requirements, recommend optimal instruments, and provide a customized quote."
              />

              <div className="mt-8 space-y-4">

                {helplinePhone && (
                  <a
                    href={`tel:${String(
                      helplinePhone
                    ).replace(/\s+/g, "")}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#F3B7CB] bg-white p-4 shadow-sm hover:border-[#BE4F78]/40 transition-colors"
                  >

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9DCE8] text-[#BE4F78] shrink-0">
                      <PhoneCall size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#6B5361]">
                        Direct Helpline
                      </p>

                      <p className="text-base font-bold text-[#3B1830]">
                        {helplinePhone}
                      </p>
                    </div>

                  </a>
                )}

                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#F3B7CB] bg-white p-4 shadow-sm hover:border-[#BE4F78]/40 transition-colors"
                  >

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9DCE8] text-[#BE4F78] shrink-0">
                      <Mail size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#6B5361]">
                        Official Email
                      </p>

                      <p className="text-base font-bold text-[#3B1830] break-all">
                        {supportEmail}
                      </p>
                    </div>

                  </a>
                )}

              </div>
            </div>

            <div className="lg:col-span-7">

              <ContactForm
                title="Request a Tailored Equipment Plan"
                subtitle="Fill out the form below and our equipment specialist will reach out within 2 hours."
              />

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}