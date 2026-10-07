"use client";

import { db, doc, getDoc, getCachedDoc, addDoc, collection } from "@/lib/client-api";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { makeSlug } from "@/data/productsData";
import { fetchAllDynamicProducts, getCachedProducts } from "@/lib/fetchProducts";
import {
  FaPlay,
  FaShareAlt,
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaLink,
} from "react-icons/fa";
import {
  Microscope,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Mail,
  Download,
  ArrowRight,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  Award,
  Zap,
} from "lucide-react";
/* =========================================================
   IMAGE → BASE64 HELPER FOR PDF
========================================================= */
const loadImageBase64 = async (src) => {
  try {
    if (!src || typeof src !== "string") return null;

    if (!src.startsWith("http")) {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          try {
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
    }

    try {
      const response = await fetch(src, { cache: "no-cache" });
      if (response.ok) {
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fallback
    }

    return null;
  } catch {
    return null;
  }
};

/* =========================================================
   MAIN PRODUCT DETAILS COMPONENT
========================================================= */
export default function ProductDetails({ slug }) {
  const [allProducts, setAllProducts] = useState(() => getCachedProducts() || []);
  const [product, setProduct] = useState(() => {
    const prods = getCachedProducts() || [];
    return prods.find((item) => item.slug === slug || makeSlug(item.title) === slug || item.id === slug) || null;
  });
  const [selectedImage, setSelectedImage] = useState(() => {
    const prods = getCachedProducts() || [];
    const found = prods.find((item) => item.slug === slug || makeSlug(item.title) === slug || item.id === slug);
    if (!found) return "";
    return (Array.isArray(found.images) && found.images.length > 0 ? found.images[0] : null) || found.image || found.imgUrl || found.imageUrl || "";
  });
  const [loading, setLoading] = useState(() => {
    const prods = getCachedProducts() || [];
    const found = prods.find((item) => item.slug === slug || makeSlug(item.title) === slug || item.id === slug);
    return !found;
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState("image");
  const [showShare, setShowShare] = useState(false);
  const [contactInfo, setContactInfo] = useState(() => {
    const cached = getCachedDoc(doc(db, "websites", "diagnotexcom", "pages", "contact"));
    return cached?.contactInfo || [];
  });
  const [downloadingBrochure, setDownloadingBrochure] = useState(false);
  const shareRef = useRef();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "items", "contact", "products"];
  const district = pathParts.length > 0 && !staticRoutes.includes(pathParts[0]) ? pathParts[0] : "";
  const city = district ? district.replace(/-/g, " ") : "India";
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path.startsWith("/") ? path : `/${path}`}`;
  };

  /* Load Product & Catalog */
  useEffect(() => {
    let isMounted = true;
    const loadProductData = async () => {
      try {
        const products = await fetchAllDynamicProducts();
        if (!isMounted) return;
        setAllProducts(products || []);

        const found = (products || []).find(
          (item) =>
            item.slug === slug ||
            makeSlug(item.title) === slug ||
            item.id === slug
        );

        if (found) {
          setProduct(found);
          const mainImg =
            (Array.isArray(found.images) && found.images.length > 0 ? found.images[0] : null) ||
            found.image ||
            found.imgUrl ||
            found.imageUrl ||
            "";
          setSelectedImage(mainImg);
          setSelectedMedia("image");
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProductData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  /* Load Contact Info */
  useEffect(() => {
    const loadContact = async () => {
      try {
        const snapshot = await getDoc(
          doc(db, "websites", "diagnotexcom", "pages", "contact")
        );
        if (snapshot.exists()) {
          setContactInfo(snapshot.data().contactInfo || []);
        }
      } catch (err) {
        console.error("Error loading contact:", err);
      }
    };
    loadContact();
  }, []);

  /* Close Share Popup on outside click */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShare(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* Extract Specifications */
  const specificationsList = useMemo(() => {
    if (!product) return [];
    const list = [];
    const added = new Set();

    const addSpec = (label, value) => {
      if (value === null || value === undefined || typeof value === "object") return;
      const strVal = String(value).trim();
      if (!strVal || strVal === "N/A" || strVal.toLowerCase() === "null") return;
      const key = label.toLowerCase().trim();
      if (!added.has(key)) {
        added.add(key);
        list.push({ label, value: strVal });
      }
    };

    if (product.brand) addSpec("Brand", product.brand);
    if (product.model) addSpec("Model", product.model);
    if (product.instrument) addSpec("Instrument", product.instrument);
    if (product.throughput) addSpec("Throughput", product.throughput);
    if (product.capacity) addSpec("Capacity", product.capacity);
    if (product.automation) addSpec("Automation", product.automation);
    if (product.usage) addSpec("Usage / Application", product.usage);
    if (product.size) addSpec("Size / Dimensions", product.size);
    if (product.availability || product.status) addSpec("Availability", product.availability || product.status);
    if (product.category) addSpec("Category", product.category);
    if (product.subCategory && product.subCategory !== product.category) addSpec("Sub Category", product.subCategory);

    // Parameters
    if (product.parameters && typeof product.parameters === "string") {
      if (product.parameters.includes("|") || product.parameters.includes(":")) {
        product.parameters.split("|").forEach((part) => {
          const colonIdx = part.indexOf(":");
          if (colonIdx !== -1) {
            const lbl = part.substring(0, colonIdx).trim();
            const val = part.substring(colonIdx + 1).trim();
            if (lbl && val) addSpec(lbl, val);
          } else if (part.trim()) {
            addSpec("Parameter", part.trim());
          }
        });
      } else {
        addSpec("Parameters", product.parameters);
      }
    }

    // Custom specs
    if (product.specs && typeof product.specs === "object") {
      if (Array.isArray(product.specs)) {
        product.specs.forEach((item) => {
          if (item?.label && item?.value) addSpec(item.label, item.value);
        });
      } else {
        Object.entries(product.specs).forEach(([k, v]) => {
          if (v && typeof v !== "object") {
            const cleanLabel = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim();
            addSpec(cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1), v);
          }
        });
      }
    }

    return list;
  }, [product]);

  /* Form Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "websites", "diagnotexcom", "enquiries"), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: `Official price quotation request for ${product?.title || slug}`,
        productName: product?.title || "",
        productSlug: slug || "",
        createdAt: new Date().toISOString(),
        source: "Product Details Page",
      });

      toast.success("Quote request submitted! Our specialist will contact you shortly.");
      setForm({ name: "", email: "", phone: "" });
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      toast.error("Submission failed. Please call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Share Helpers */
  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
      setShowShare(false);
    }
  };

  const handleWhatsappShare = () => {
    if (typeof window !== "undefined") {
      const text = `🔬 Check out: ${product?.title}\n${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  /* Download Brochure */
  const handleDownloadBrochure = async () => {
    if (!product) return;
    try {
      setDownloadingBrochure(true);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Colors
      const primaryColor = [190, 79, 120]; // #BE4F78
      const darkColor = [59, 24, 48]; // #3B1830
      const grayColor = [107, 83, 97]; // #6B5361

      // Header Banner
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, 210, 24, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text("RAJ BIOSIS PRIVATE LIMITED", 14, 15);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Certified Biomedical & Diagnostic Equipment", 120, 15);

      // Title
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      const titleLines = pdf.splitTextToSize(product.title || "Product Specifications", 180);
      pdf.text(titleLines, 14, 38);

      let currentY = 38 + titleLines.length * 7;

      // Category
      pdf.setFontSize(10);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text(`Category: ${(product.category || "Biomedical").toUpperCase()}`, 14, currentY);
      currentY += 8;

      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      const desc = (product.desc || product.description || "High precision medical laboratory equipment.").substring(0, 300);
      const descLines = pdf.splitTextToSize(desc, 180);
      pdf.text(descLines, 14, currentY);
      currentY += descLines.length * 5 + 8;

      // Specs Table
      if (specificationsList.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        pdf.text("Technical Specifications", 14, currentY);
        currentY += 6;

        pdf.setDrawColor(243, 183, 203);
        pdf.setLineWidth(0.4);

        specificationsList.slice(0, 12).forEach((spec, idx) => {
          if (currentY > 260) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.setFillColor(idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 247 : 235, idx % 2 === 0 ? 250 : 242);
          pdf.rect(14, currentY - 4, 182, 8, "F");
          pdf.rect(14, currentY - 4, 182, 8, "S");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          pdf.text(spec.label, 17, currentY + 1.5);

          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          pdf.text(String(spec.value).substring(0, 60), 75, currentY + 1.5);

          currentY += 8;
        });
      }

      // Footer
      pdf.setFillColor(252, 231, 239);
      pdf.rect(0, 275, 210, 22, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text("Raj Biosis Private Limited • 24/7 Biomedical Support • www.diagnotex.com", 14, 287);

      pdf.save(`${makeSlug(product.title || "product")}-brochure.pdf`);
      toast.success("Brochure downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not generate PDF. Please try again.");
    } finally {
      setDownloadingBrochure(false);
    }
  };

  /* Schema data */
  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        image: product.image ? [product.image] : [],
        description: product.desc || product.description || product.title,
        brand: {
          "@type": "Brand",
          name: product.brand || "Raj Biosis Private Limited",
        },
      }
    : null;

  /* Skeletons */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7FA] py-12 sm:py-16">
        <div className="container-custom">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="h-[420px] rounded-3xl bg-white/80 border border-[#F3B7CB] animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-1/3 rounded-xl bg-white border border-[#F3B7CB] animate-pulse" />
              <div className="h-12 w-3/4 rounded-2xl bg-white border border-[#F3B7CB] animate-pulse" />
              <div className="h-24 w-full rounded-2xl bg-white border border-[#F3B7CB] animate-pulse" />
              <div className="h-14 w-1/2 rounded-2xl bg-[#BE4F78]/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Product Not Found */
  if (!product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FFF7FA] py-20 text-center">
        <div className="container-custom max-w-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-[#F3B7CB] text-[#BE4F78] shadow-md">
            <Microscope size={40} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-[#3B1830]">Product Not Found</h1>
          <p className="mt-3 text-sm text-[#6B5361]">
            The diagnostic equipment you are looking for might have been updated or moved.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href={makeLink("/items")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#BE4F78] px-6 py-3.5 text-sm font-bold !text-white shadow-md hover:bg-[#8F385B] transition-all"
            >
              Browse All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = (
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || product.imgUrl || product.imageUrl || selectedImage]
  ).filter((img) => img && typeof img === "string" && img !== "/logo.png");

  const relatedProducts = allProducts
    .filter((p) => p.slug !== product.slug && (p.category === product.category || !product.category))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FFF7FA] text-[#3B1830] py-8 sm:py-12">
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}

      <div className="container-custom">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6B5361]">
          <Link href={makeLink("/")} className="hover:text-[#BE4F78] transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link href={makeLink("/items")} className="hover:text-[#BE4F78] transition-colors">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight size={14} />
              <span className="text-[#BE4F78] font-bold truncate max-w-[150px]">
                {product.category}
              </span>
            </>
          )}
          <ChevronRight size={14} />
          <span className="text-[#3B1830] truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Top Section: Media Gallery + Overview */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Column: Image / Video Gallery */}
          <div>
            <div className="relative h-[360px] sm:h-[440px] lg:h-[480px] w-full overflow-hidden rounded-3xl border-2 border-[#F3B7CB] bg-white p-6 shadow-lg shadow-[#BE4F78]/5 flex items-center justify-center">
              {/* Premium Badge */}
              <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8F385B] to-[#BE4F78] px-3.5 py-1.5 text-xs font-bold !text-white shadow-md">
                <Sparkles size={13} className="text-amber-300" />
                <span>Certified Standard</span>
              </div>

              {selectedMedia === "video" && product.video ? (
                <video controls autoPlay className="h-full w-full object-contain">
                  <source src={product.video} type="video/mp4" />
                </video>
              ) : selectedImage && selectedImage !== "/logo.png" ? (
                <div className="relative h-full w-full">
                  <Image
                    src={selectedImage}
                    alt={product.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onLoad={() => setImageLoaded(true)}
                    className={`object-contain transition-transform duration-500 hover:scale-105 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 animate-pulse">
                      <Microscope size={36} className="text-[#BE4F78] animate-bounce" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFF7FA] border border-[#F3B7CB] text-[#BE4F78]">
                    <Microscope size={40} />
                  </div>
                  <span className="mt-4 text-sm font-bold uppercase tracking-wider text-[#8F385B]">
                    {product.category || "Biomedical Analyzer"}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedImage(imgUrl);
                    setSelectedMedia("image");
                    setImageLoaded(false);
                  }}
                  className={`relative h-18 w-18 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                    selectedMedia === "image" && selectedImage === imgUrl
                      ? "border-[#BE4F78] shadow-md shadow-[#BE4F78]/30 scale-105"
                      : "border-[#F3B7CB] bg-white opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image src={imgUrl} alt={`Thumb ${idx + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}

              {product.video && (
                <button
                  type="button"
                  onClick={() => setSelectedMedia("video")}
                  className={`flex h-18 w-18 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                    selectedMedia === "video"
                      ? "border-[#BE4F78] bg-[#FCE7EF] text-[#BE4F78] shadow-md"
                      : "border-[#F3B7CB] bg-white text-[#6B5361]"
                  }`}
                >
                  <FaPlay size={16} />
                  <span className="mt-1 text-[10px] font-bold">Video</span>
                </button>
              )}

              {product.pdf && (
                <a
                  href={product.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-18 w-18 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-2xl border-2 border-[#F3B7CB] bg-white text-[#6B5361] hover:border-[#BE4F78] hover:text-[#BE4F78] transition-all"
                >
                  <FileText size={18} />
                  <span className="mt-1 text-[10px] font-bold">PDF Spec</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Title, Quick Actions & Highlights */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category & Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[#BE4F78]/30 bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#BE4F78] shadow-sm">
                  {product.subCategory && product.subCategory !== product.category
                    ? `${product.category} • ${product.subCategory}`
                    : product.category || "Biomedical Equipment"}
                </span>

                {(product.availability || product.status) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold !text-white shadow-sm">
                    <CheckCircle2 size={13} />
                    {product.availability || product.status}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black text-[#3B1830] leading-tight">
                {product.title}
              </h1>

              {/* Description Snippet */}
              <p className="mt-4 text-sm sm:text-base text-[#6B5361] leading-relaxed">
                {product.desc ||
                  product.description ||
                  "Precision engineered clinical diagnostic instrument designed for high accuracy and reliable laboratory automation."}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadBrochure}
                  disabled={downloadingBrochure}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#BE4F78] px-6 py-3.5 text-sm font-bold !text-white shadow-lg shadow-[#BE4F78]/25 hover:bg-[#8F385B] hover:shadow-xl transition-all disabled:opacity-75"
                >
                  <Download size={16} />
                  <span>{downloadingBrochure ? "Generating..." : "Download Brochure"}</span>
                </button>

                <div ref={shareRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowShare((v) => !v)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F3B7CB] bg-white text-[#BE4F78] shadow-sm hover:bg-[#FCE7EF] hover:border-[#BE4F78] transition-all"
                    aria-label="Share Product"
                  >
                    <FaShareAlt size={16} />
                  </button>

                  {showShare && (
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-14 z-50 w-52 overflow-hidden rounded-2xl border border-[#F3B7CB] bg-white p-2 shadow-2xl">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3B1830] hover:bg-[#FCE7EF] hover:text-[#BE4F78] transition-all"
                      >
                        <FaLink /> Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={handleWhatsappShare}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3B1830] hover:bg-[#FCE7EF] hover:text-emerald-600 transition-all"
                      >
                        <FaWhatsapp /> Share via WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Value Props */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 border-t border-[#F3B7CB]/60 pt-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 border border-[#F3B7CB]/60">
                  <ShieldCheck size={20} className="text-[#BE4F78] shrink-0" />
                  <div>
                    <div className="font-bold text-[#3B1830]">NABL Traceable</div>
                    <div className="text-[11px] text-[#6B5361]">Certified Calibration</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 border border-[#F3B7CB]/60">
                  <Zap size={20} className="text-[#BE4F78] shrink-0" />
                  <div>
                    <div className="font-bold text-[#3B1830]">24/7 Field AMC</div>
                    <div className="text-[11px] text-[#6B5361]">On-Site SLA Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Inquiry Form (Left) + Specifications Table (Right) */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
          {/* Quick Inquiry Sticky Box */}
          <div className="h-fit rounded-3xl border border-[#F3B7CB] bg-white p-6 sm:p-7 shadow-lg shadow-[#BE4F78]/5 lg:sticky lg:top-24">
            <span className="inline-flex rounded-full bg-[#FCE7EF] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#8F385B]">
              Quick Inquiry
            </span>
            <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#3B1830]">
              Get Instant Price Quote
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#6B5361]">
              Enter your contact info to receive official quotation and specifications.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#3B1830] mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-[#F3B7CB] bg-[#FFF7FA] px-4 py-3 text-sm text-[#3B1830] outline-none transition-all placeholder:text-[#6B5361]/60 focus:border-[#BE4F78] focus:bg-white focus:ring-2 focus:ring-[#BE4F78]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B1830] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={12}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  className="w-full rounded-xl border border-[#F3B7CB] bg-[#FFF7FA] px-4 py-3 text-sm text-[#3B1830] outline-none transition-all placeholder:text-[#6B5361]/60 focus:border-[#BE4F78] focus:bg-white focus:ring-2 focus:ring-[#BE4F78]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B1830] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@hospital.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-[#F3B7CB] bg-[#FFF7FA] px-4 py-3 text-sm text-[#3B1830] outline-none transition-all placeholder:text-[#6B5361]/60 focus:border-[#BE4F78] focus:bg-white focus:ring-2 focus:ring-[#BE4F78]/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#BE4F78] py-3.5 text-sm font-bold !text-white shadow-md hover:bg-[#8F385B] hover:shadow-lg transition-all disabled:opacity-75 mt-2"
              >
                {submitting ? "Submitting Inquiry..." : "Request Price Quote"}
              </button>
            </form>
          </div>

          {/* Right Column: Full Specifications & Overview */}
          <div className="space-y-8">
            {/* Technical Specifications Table */}
            <div className="rounded-3xl border border-[#F3B7CB] bg-white p-6 sm:p-8 shadow-sm">
              <span className="inline-flex rounded-full bg-[#FCE7EF] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#8F385B]">
                Datasheet
              </span>
              <h3 className="mt-3 text-2xl font-black text-[#3B1830]">
                Technical Specifications
              </h3>

              {specificationsList.length > 0 ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-[#F3B7CB]/60">
                  <table className="w-full border-collapse text-left">
                    <tbody>
                      {specificationsList.map((spec, idx) => (
                        <tr
                          key={`${spec.label}-${idx}`}
                          className={`border-b border-[#F3B7CB]/40 last:border-b-0 ${
                            idx % 2 === 0 ? "bg-[#FFF7FA]/60" : "bg-white"
                          }`}
                        >
                          <td className="w-2/5 px-4 py-3 text-xs sm:text-sm font-bold text-[#BE4F78] border-r border-[#F3B7CB]/30">
                            {spec.label}
                          </td>
                          <td className="w-3/5 px-4 py-3 text-xs sm:text-sm font-semibold text-[#3B1830]">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#6B5361]">
                  Full technical specifications available in brochure download.
                </p>
              )}
            </div>

            {/* SEO Information Section */}
            <div className="rounded-3xl border border-[#F3B7CB] bg-white p-6 sm:p-8 shadow-sm">
              <span className="inline-flex rounded-full bg-[#FCE7EF] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#8F385B]">
                Product Guide
              </span>
              <h3 className="mt-3 text-2xl font-black text-[#3B1830]">
                Why Choose {product.title} in {cityName}?
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#FFF7FA] p-4 border border-[#F3B7CB]/60">
                  <h4 className="text-sm font-bold text-[#BE4F78]">Diagnostic Accuracy</h4>
                  <p className="mt-1.5 text-xs text-[#6B5361] leading-relaxed">
                    NABL calibrated diagnostics ensure clinical repeatability for hospitals and pathology labs.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF7FA] p-4 border border-[#F3B7CB]/60">
                  <h4 className="text-sm font-bold text-[#BE4F78]">Nationwide Engineering Support</h4>
                  <p className="mt-1.5 text-xs text-[#6B5361] leading-relaxed">
                    Our biomedical engineers deliver routine preventive maintenance and urgent emergency breakdown support.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF7FA] p-4 border border-[#F3B7CB]/60">
                  <h4 className="text-sm font-bold text-[#BE4F78]">Authorized Supply in {cityName}</h4>
                  <p className="mt-1.5 text-xs text-[#6B5361] leading-relaxed">
                    Genuine OEM instruments with manufacturer warranty, installation certification, and operator training.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF7FA] p-4 border border-[#F3B7CB]/60">
                  <h4 className="text-sm font-bold text-[#BE4F78]">Reagents & Consumables</h4>
                  <p className="mt-1.5 text-xs text-[#6B5361] leading-relaxed">
                    Consistent cold-chain delivery of matching analyzer reagents, calibrators, and control sera.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#8F385B] to-[#BE4F78] p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black !text-white">
              Need Expert Consultation for {product.title}?
            </h3>
            <p className="mt-2 text-sm text-[#FDEBF2] max-w-xl">
              Talk directly with our biomedical application specialist for customized configuration, hospital pricing, and AMC agreements.
            </p>
          </div>
          <Link
            href={makeLink("/contact")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold !text-[#8F385B] shadow-md hover:bg-[#FFF7FA] hover:scale-105 transition-all shrink-0"
          >
            <PhoneCall size={16} /> Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}