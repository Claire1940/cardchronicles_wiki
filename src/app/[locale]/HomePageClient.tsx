"use client";

import { Suspense, lazy, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Crown,
  Dices,
  Flame,
  FlaskConical,
  Gem,
  Gift,
  Hammer,
  Layers,
  RefreshCcw,
  Repeat,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

// 模块卡片图标本地映射（validate-icons 只查 tools.cards，模块卡片图标不经 iconRegistry）
const MODULE_ICONS: Record<string, LucideIcon> = {
  // Module 1: Card Chronicles Codes
  Gift,
  Ticket,
  Sparkles,
  Coins,
  Trophy,
  Star,
  // Module 2: Card Chronicles Beginner Guide
  Dices,
  Users,
  Zap,
  FlaskConical,
  RefreshCcw,
  TrendingUp,
  // Module 3: Card Chronicles Tier List
  Crown,
  ShieldCheck,
  Swords,
  Layers,
  // Module 4: Card Chronicles Rolling and Rarity
  Repeat,
  Gem,
  Hammer,
  Wand2,
  RotateCcw,
  Target,
  Clock,
  Flame,
};

function getModuleIcon(name: string): LucideIcon {
  return MODULE_ICONS[name] ?? Sparkles;
}

// 把标题文本按条件渲染为文章内链或纯文本（无匹配文章时降级为纯文本）
function LinkedTitle({
  linkData,
  children,
  className,
  locale,
}: {
  linkData: { url: string; title: string } | null | undefined;
  children: ReactNode;
  className?: string;
  locale: string;
}) {
  if (linkData) {
    const href = locale === "en" ? linkData.url : `/${locale}${linkData.url}`;
    return (
      <Link
        href={href}
        className={`${className || ""} hover:text-[hsl(var(--nav-theme-light))] hover:underline decoration-[hsl(var(--nav-theme-light))/0.4] underline-offset-4 transition-colors`}
        title={linkData.title}
      >
        {children}
      </Link>
    );
  }
  return <>{children}</>;
}

// Accordion 面板（Upgrades & Abilities 模块用，受控展开/折叠，首项默认展开）
function AccordionPanel({
  icon: Icon,
  heading,
  content,
  defaultOpen = false,
}: {
  icon: LucideIcon;
  heading: string;
  content: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-white/5 overflow-hidden transition-colors hover:border-[hsl(var(--nav-theme)/0.5)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 md:p-5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex h-10 w-10 md:h-11 md:w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.1)]">
          <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
        </div>
        <h3 className="flex-1 text-base md:text-lg font-bold">{heading}</h3>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-[hsl(var(--nav-theme-light))] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 md:pl-[4.75rem]">
          <p className="text-sm md:text-base text-muted-foreground leading-7">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}

// Tier 视觉强度（全部主题色，按透明度递减区分 S/A/B/C）
function tierBadgeClass(tier: string): string {
  switch (tier) {
    case "S":
      return "bg-[hsl(var(--nav-theme)/0.25)] border-[hsl(var(--nav-theme)/0.6)] text-[hsl(var(--nav-theme-light))]";
    case "A":
      return "bg-[hsl(var(--nav-theme)/0.18)] border-[hsl(var(--nav-theme)/0.45)] text-[hsl(var(--nav-theme-light))]";
    case "B":
      return "bg-[hsl(var(--nav-theme)/0.12)] border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))]";
    default:
      return "bg-white/5 border-border text-muted-foreground";
  }
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

export default function HomePageClient({
  latestArticles,
  moduleLinkMap,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.cardchronicles.wiki";

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Card Chronicles Wiki",
        description:
          "Complete Card Chronicles Wiki covering Roblox codes, card tier list, traits, reroll tips, beginner guide, team lineups, waves, and updates.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Card Chronicles - Anime Card RNG Battler",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Card Chronicles Wiki",
        alternateName: "Card Chronicles",
        url: siteUrl,
        description:
          "Complete Card Chronicles Wiki resource hub for Roblox codes, cards, tier list, traits, lineups, waves, and progression guides",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Card Chronicles Wiki - Anime Card RNG Battler",
        },
        sameAs: [
          "https://www.roblox.com/games/114758508835875/Card-Chronicles",
          "https://www.roblox.com/communities/35338731/Chronicle-Entertainment",
          "https://www.youtube.com/watch?v=zI7WQHQdj4o",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Card Chronicles",
        gamePlatform: ["Roblox"],
        applicationCategory: "Game",
        genre: ["Card Game", "RPG", "Anime"],
        numberOfPlayers: {
          minValue: 1,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.roblox.com/games/114758508835875/Card-Chronicles",
        },
      },
      {
        "@type": "VideoObject",
        name: "NEW Card Chronicles RNG Anime Game Dropped & It Looks PEAK! Roblox",
        description:
          "Card Chronicles gameplay preview - an anime card RNG battler on Roblox where you roll rare cards, upgrade abilities, and fight endless waves.",
        uploadDate: "2026-06-27",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/zI7WQHQdj4o",
        url: "https://www.youtube.com/watch?v=zI7WQHQdj4o",
      },
    ],
  };

  // Tools Grid 卡片 → section 锚点映射（8 模块）
  const toolAnchors = [
    "codes",
    "beginner-guide",
    "tier-list",
    "rolling-rarity",
    "traits-rerolls",
    "upgrades-abilities",
    "best-lineup",
    "potions-boosts",
  ];

  const mobileBannerAd = getPreferredMobileBannerSelection();

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("codes")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <Gift className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://www.roblox.com/games/114758508835875/Card-Chronicles"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnRobloxCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* Video Section - 紧跟 Hero 之后，桌面端宽幅 16:9 容器（max-w-5xl 上限） */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="zI7WQHQdj4o"
              title="Card Chronicles - Gameplay Preview"
            />
          </div>
        </div>
      </section>

      {/* Tools Grid - 模块导航区（位于视频之后、Latest Updates 之前） */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {t.tools.cards.map((card: any, index: number) => (
              <button
                key={index}
                onClick={() => scrollToSection(toolAnchors[index])}
                className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                           bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                           transition-all duration-300 cursor-pointer text-left
                           hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                              bg-[hsl(var(--nav-theme)/0.1)]
                              flex items-center justify-center
                              group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                              transition-colors"
                >
                  <DynamicIcon
                    name={card.icon}
                    className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
                  />
                </div>
                <h3 className="mb-1.5 text-sm md:text-base font-semibold">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Module 1: Card Chronicles Codes */}
      <section id="codes" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Gift className="w-4 h-4" />
              {t.modules.cardChroniclesCodes.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesCodes"]} locale={locale}>
                {t.modules.cardChroniclesCodes.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesCodes.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesCodes.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.modules.cardChroniclesCodes.items.map((card: any, index: number) => {
              const Icon = getModuleIcon(card.icon);
              return (
                <div
                  key={index}
                  className="flex flex-col p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.1)]">
                      <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.4)] text-[hsl(var(--nav-theme-light))] font-medium">
                      <Check className="w-3 h-3" />
                      {card.status}
                    </span>
                  </div>
                  <code className="text-sm md:text-base font-mono font-semibold text-[hsl(var(--nav-theme-light))] bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.25)] rounded-md px-3 py-2 mb-3 break-all">
                    {card.code}
                  </code>
                  <p className="text-sm text-muted-foreground mb-3">
                    {card.rewardSummary}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {card.rewards.map((r: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-md bg-white/5 border border-border"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
                        Requires
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {card.requirements.join(", ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground border-t border-border pt-2">
                      {card.bestFor}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* Module 2: Card Chronicles Beginner Guide */}
      <section
        id="beginner-guide"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Dices className="w-4 h-4" />
              {t.modules.cardChroniclesBeginnerGuide.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesBeginnerGuide"]} locale={locale}>
                {t.modules.cardChroniclesBeginnerGuide.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesBeginnerGuide.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesBeginnerGuide.intro}
            </p>
          </div>

          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.cardChroniclesBeginnerGuide.items.map(
              (step: any, index: number) => {
                const Icon = getModuleIcon(step.icon);
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-3 md:flex-row md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="flex items-center gap-3 md:flex-shrink-0">
                      <div className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                        <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                      </div>
                      <span className="md:hidden text-lg font-bold text-[hsl(var(--nav-theme-light))]">
                        {step.step}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                        <span className="hidden md:inline text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                          {step.step}.
                        </span>
                        <h3 className="text-lg md:text-xl font-bold">
                          {step.heading}
                        </h3>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-3">
                        {step.description}
                      </p>
                      <div className="flex items-start gap-2 rounded-lg border border-dashed border-[hsl(var(--nav-theme)/0.4)] bg-[hsl(var(--nav-theme)/0.06)] px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {step.mistakeToAvoid}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 3: Card Chronicles Tier List */}
      <section id="tier-list" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Crown className="w-4 h-4" />
              {t.modules.cardChroniclesTierList.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesTierList"]} locale={locale}>
                {t.modules.cardChroniclesTierList.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesTierList.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesTierList.intro}
            </p>
          </div>

          <div className="scroll-reveal space-y-4">
            {t.modules.cardChroniclesTierList.items.map(
              (tier: any, index: number) => {
                const Icon = getModuleIcon(tier.icon);
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-4 p-5 md:flex-row md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    {/* Tier 徽章 */}
                    <div className="flex items-center gap-3 md:flex-col md:items-center md:gap-2 md:w-28 md:flex-shrink-0">
                      <div
                        className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl border-2 text-2xl md:text-3xl font-extrabold ${tierBadgeClass(
                          tier.tier,
                        )}`}
                      >
                        {tier.tier}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
                        <Icon className="w-3 h-3 text-[hsl(var(--nav-theme-light))]" />
                        {tier.upgradePriority}
                      </span>
                    </div>
                    {/* Tier 内容 */}
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold mb-2">
                        {tier.label}
                      </h3>
                      <div className="grid grid-cols-1 gap-1.5 mb-3 sm:grid-cols-2">
                        {tier.cards.map((c: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {tier.bestFor.map((b: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-md bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))]"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground border-t border-border pt-2">
                        {tier.notes}
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* 广告位 5: 移动端横幅 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* Module 4: Card Chronicles Rolling and Rarity Guide */}
      <section
        id="rolling-rarity"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Repeat className="w-4 h-4" />
              {t.modules.cardChroniclesRollingRarity.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesRollingRarity"]} locale={locale}>
                {t.modules.cardChroniclesRollingRarity.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesRollingRarity.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesRollingRarity.intro}
            </p>
          </div>

          {/* 桌面端：表格；移动端：堆叠卡片 */}
          <div className="scroll-reveal hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[hsl(var(--nav-theme)/0.1)] text-[hsl(var(--nav-theme-light))]">
                  <th className="px-4 py-3 font-semibold">System</th>
                  <th className="px-4 py-3 font-semibold">What it means</th>
                  <th className="px-4 py-3 font-semibold">Best use</th>
                  <th className="px-4 py-3 font-semibold">Resource note</th>
                </tr>
              </thead>
              <tbody>
                {t.modules.cardChroniclesRollingRarity.items.map(
                  (row: any, index: number) => {
                    const Icon = getModuleIcon(row.icon);
                    return (
                      <tr
                        key={index}
                        className="border-t border-border align-top"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-[hsl(var(--nav-theme-light))] flex-shrink-0" />
                            <span className="font-semibold">{row.system}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.whatItMeans}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.bestUse}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.resourceNote}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {t.modules.cardChroniclesRollingRarity.items.map(
              (row: any, index: number) => {
                const Icon = getModuleIcon(row.icon);
                return (
                  <div
                    key={index}
                    className="p-4 bg-white/5 border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                      <span className="font-semibold">{row.system}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {row.whatItMeans}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-semibold text-[hsl(var(--nav-theme-light))]">
                        Best use:
                      </span>{" "}
                      {row.bestUse}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-[hsl(var(--nav-theme-light))]">
                        Resource note:
                      </span>{" "}
                      {row.resourceNote}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 5: Card Chronicles Traits and Rerolls */}
      <section id="traits-rerolls" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <RefreshCcw className="w-4 h-4" />
              {t.modules.cardChroniclesTraitsRerolls.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesTraitsRerolls"]} locale={locale}>
                {t.modules.cardChroniclesTraitsRerolls.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesTraitsRerolls.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesTraitsRerolls.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.modules.cardChroniclesTraitsRerolls.items.map(
              (card: any, index: number) => {
                const Icon = getModuleIcon(card.icon);
                return (
                  <div
                    key={index}
                    className="flex flex-col p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.1)]">
                        <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                      </div>
                      <h3 className="text-lg font-bold">{card.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {card.role}
                    </p>
                    <div className="mt-auto space-y-3">
                      <div className="flex items-start gap-2 rounded-lg border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.06)] px-3 py-2">
                        <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                        <p className="text-xs md:text-sm text-muted-foreground">
                          <span className="font-semibold text-[hsl(var(--nav-theme-light))]">
                            Best use:{" "}
                          </span>
                          {card.bestUse}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-white/[0.02] px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs md:text-sm text-muted-foreground">
                          <span className="font-semibold">Avoid: </span>
                          {card.avoid}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 6: Card Chronicles Upgrades and Abilities */}
      <section
        id="upgrades-abilities"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Wand2 className="w-4 h-4" />
              {t.modules.cardChroniclesUpgradesAbilities.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesUpgradesAbilities"]} locale={locale}>
                {t.modules.cardChroniclesUpgradesAbilities.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesUpgradesAbilities.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesUpgradesAbilities.intro}
            </p>
          </div>

          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.cardChroniclesUpgradesAbilities.items.map(
              (item: any, index: number) => (
                <AccordionPanel
                  key={index}
                  icon={getModuleIcon(item.icon)}
                  heading={item.heading}
                  content={item.content}
                  defaultOpen={index === 0}
                />
              ),
            )}
          </div>
        </div>
      </section>

      {/* 广告位 6: 模块 5-6 之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* Module 7: Card Chronicles Best Lineup and Team Builds */}
      <section id="best-lineup" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <Layers className="w-4 h-4" />
              {t.modules.cardChroniclesBestLineup.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesBestLineup"]} locale={locale}>
                {t.modules.cardChroniclesBestLineup.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesBestLineup.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesBestLineup.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 gap-4 md:grid-cols-2">
            {t.modules.cardChroniclesBestLineup.items.map(
              (card: any, index: number) => {
                const Icon = getModuleIcon(card.icon);
                return (
                  <div
                    key={index}
                    className="flex flex-col p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.1)]">
                        <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                      </div>
                      <h3 className="text-lg font-bold">{card.name}</h3>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {card.coreRoles.map((role: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                          <span>{role}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {card.strategy}
                    </p>
                    <div className="mt-auto">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.35)] text-[hsl(var(--nav-theme-light))] font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {card.upgradePriority}
                      </span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 8: Card Chronicles Potions, Chronogems and Boosts */}
      <section
        id="potions-boosts"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-xs md:text-sm font-medium text-[hsl(var(--nav-theme-light))]">
              <FlaskConical className="w-4 h-4" />
              {t.modules.cardChroniclesPotionsChronogems.eyebrow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle linkData={moduleLinkMap["cardChroniclesPotionsChronogems"]} locale={locale}>
                {t.modules.cardChroniclesPotionsChronogems.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-3 md:mb-4">
              {t.modules.cardChroniclesPotionsChronogems.subtitle}
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              {t.modules.cardChroniclesPotionsChronogems.intro}
            </p>
          </div>

          {/* 桌面端：表格；移动端：堆叠卡片 */}
          <div className="scroll-reveal hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[hsl(var(--nav-theme)/0.1)] text-[hsl(var(--nav-theme-light))]">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">What it does</th>
                  <th className="px-4 py-3 font-semibold">Best timing</th>
                </tr>
              </thead>
              <tbody>
                {t.modules.cardChroniclesPotionsChronogems.items.map(
                  (row: any, index: number) => {
                    const Icon = getModuleIcon(row.icon);
                    return (
                      <tr
                        key={index}
                        className="border-t border-border align-top"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-[hsl(var(--nav-theme-light))] flex-shrink-0" />
                            <span className="font-semibold">{row.item}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))]">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.use}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.bestTiming}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {t.modules.cardChroniclesPotionsChronogems.items.map(
              (row: any, index: number) => {
                const Icon = getModuleIcon(row.icon);
                return (
                  <div
                    key={index}
                    className="p-4 bg-white/5 border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                      <span className="font-semibold">{row.item}</span>
                      <span className="ml-auto text-xs px-2 py-1 rounded-md bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))]">
                        {row.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{row.use}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-[hsl(var(--nav-theme-light))]">
                        Best timing:{" "}
                      </span>
                      {row.bestTiming}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.roblox.com/games/114758508835875/Card-Chronicles"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.robloxGame}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/communities/35338731/Chronicle-Entertainment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.robloxCommunity}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/watch?v=zI7WQHQdj4o"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.youtube}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
