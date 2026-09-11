"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const pathname = usePathname();

  const pathParts = pathname
    .split("/")
    .filter(Boolean);

  const staticRoutes = [
    "about",
    "services",
    "items",
    "contact",
  ];

  const district =
    pathParts.length > 0 &&
      !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;

    if (path === "/") {
      return `/${district}`;
    }

    return `/${district}${path}`;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Products", path: "/items" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#F3B7CB]/80 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="container-custom flex h-20 items-center justify-between">
        {/* Logo */}
        <Link
          href={makeLink("/")}
          className="relative block h-16 w-48 shrink-0 transition-transform hover:scale-105"
        >
          <Image
            src="/logo.png"
            alt="Raj Biosis Private Limited"
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.path ||
              (district &&
                pathname ===
                  `/${district}${link.path === "/" ? "" : link.path}`);

            return (
              <Link
                key={link.name}
                href={makeLink(link.path)}
                className={`relative py-1 text-[15px] font-bold tracking-tight transition-all duration-300 ${
                  isActive
                    ? "!text-[#BE4F78]"
                    : "text-[#3B1830] hover:text-[#BE4F78]"
                }`}
              >
                <span className={isActive ? "!text-[#BE4F78]" : "text-[#3B1830] hover:text-[#BE4F78]"}>
                  {link.name}
                </span>
                <span
                  className={`absolute left-0 -bottom-1 h-[2.5px] bg-[#BE4F78] transition-all duration-300 rounded-full ${
                    isActive ? "w-full" : "w-0 hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop Button */}
        <div className="hidden lg:block">
          <Link href={makeLink("/contact")}>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-[#BE4F78] px-6 py-3 text-sm font-bold !text-white shadow-md transition-all duration-300 hover:bg-[#8F385B] hover:shadow-xl hover:shadow-[#BE4F78]/25 hover:-translate-y-0.5"
            >
              <span className="!text-white text-white font-bold">Get Quote</span>
            </button>
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-xl border border-[#F3B7CB] bg-[#FCE7EF] p-2 transition-all duration-300 hover:bg-[#F9DCE8] lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          {menuOpen ? (
            <X size={26} className="text-[#BE4F78]" />
          ) : (
            <Menu size={26} className="text-[#BE4F78]" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          menuOpen ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        <div className="border-t border-[#F3B7CB] bg-white px-6 py-6 shadow-xl">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.path ||
                (district &&
                  pathname ===
                    `/${district}${link.path === "/" ? "" : link.path}`);

              return (
                <Link
                  key={link.name}
                  href={makeLink(link.path)}
                  onClick={() => setMenuOpen(false)}
                  className={`text-base font-bold transition-all duration-300 ${
                    isActive
                      ? "!text-[#BE4F78]"
                      : "text-[#3B1830] hover:text-[#BE4F78]"
                  }`}
                >
                  <span className={isActive ? "!text-[#BE4F78]" : "text-[#3B1830] hover:text-[#BE4F78]"}>
                    {link.name}
                  </span>
                </Link>
              );
            })}

            <Link
              href={makeLink("/contact")}
              onClick={() => setMenuOpen(false)}
              className="mt-2"
            >
              <button
                type="button"
                className="w-full rounded-xl bg-[#BE4F78] py-3.5 text-sm font-bold !text-white transition-all duration-300 hover:bg-[#8F385B] shadow-md"
              >
                <span className="!text-white text-white font-bold">Get Quote</span>
              </button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}