# Upskill Homepage -- Visual Design Specification

## Global Design Tokens

| Token | Value |
|---|---|
| Primary blue | `#0052cc` → Tailwind `text-primary`, `bg-primary`, `ring-primary`, `border-primary` |
| Font body | `font-family: "Inter", ui-sans-serif, system-ui` |
| Font serif | `font-family: "Playfair Display", Georgia, serif` |
| Container max-w (default) | `max-w-[80rem]` (Tailwind container) |
| Section padding (regular) | `py-18 md:py-22` |
| Section padding (tall) | `py-20 md:py-24` |
| Heading baseline | `text-3xl md:text-5xl font-semibold tracking-tight text-slate-950` |
| Subtitle baseline | `text-base leading-relaxed text-slate-600 mt-4 max-w-3xl` |
| Card default | `rounded-2xl border border-slate-200 bg-white shadow-sm` |
| Card elevated | `rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]` |
| Hover lift | `transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]` |
| GSAP reveal attr | `data-reveal=""` on content blocks |
| Section wrapper attr | `data-home-section=""` on `<section>` |
| Container class | `container` (centered, px-4 sm:px-6 lg:px-8, max-w-[80rem]) |

### Section Background Alternation
```
S1 Hero          → bg-slate-50
S2 CompanyLogos  → bg-white
S3 FeaturedCourses → bg-slate-50   (already exists)
S4 PopularSkills → bg-white
S5 StudentSuccess → bg-slate-50
S6 Categories    → bg-white        (already exists)
S7 CertPrep      → bg-slate-50
S8 FinalCTA      → bg-slate-50     (already exists)
```

---

## SECTION 1: HomeHeroSection (MODIFY)

### Section Wrapper
```css
/* Same as current */
className="relative overflow-hidden bg-slate-50 py-12 md:py-16"
```
Keep `id="home-hero"`, `data-home-section=""`, and the parallax gradient overlay exactly as-is.

### Container Grid
```css
/* Keep current 2-col grid layout */
className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
```

### Tag Pill (unchanged)
```html
<span data-hero-reveal="tag"
  class="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300
         bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
  <GraduationCap class="h-4 w-4" />
  Academic and career advancement
</span>
```

### Headline (UPDATED)
```html
<h1 data-hero-reveal="title"
  class="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 md:text-5xl xl:text-6xl">
  <span class="line block overflow-hidden">Learn essential career</span>
  <span class="line block overflow-hidden">and life skills</span>
</h1>
```

### Sub-headline (UPDATED)
```html
<p data-hero-reveal="body"
  class="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0 lg:text-lg">
  Industry-aligned programs with mentor support and portfolio projects
</p>
```

### Search Bar (NEW -- between sub-headline and CTAs)
```html
<div data-hero-reveal="cta"
  class="relative mx-auto mt-7 w-full max-w-lg lg:mx-0">
  <!-- Icon -->
  <Search class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
  <!-- Input -->
  <input
    type="text"
    placeholder="Search for courses, skills, or topics..."
    class="w-full rounded-xl border border-slate-300 bg-white py-4 pl-12 pr-5
           text-base text-slate-900 placeholder:text-slate-400
           shadow-sm outline-none transition-all duration-200
           focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_0_4px_rgba(0,82,204,0.1)]"
  />
</div>
```

| Property | Value |
|---|---|
| Width | `w-full max-w-lg` (560px) |
| Height | `py-4` (padding-y = 1rem → total ~56px) |
| Border radius | `rounded-xl` (12px) |
| Border | `border border-slate-300` |
| Background | `bg-white` |
| Icon | lucide-react `Search`, `h-5 w-5`, `left-4`, `text-slate-400` |
| Placeholder text | `text-slate-400`, `text-base` |
| Input text | `text-slate-900`, `text-base` |
| Focus ring | `ring-2 ring-primary/20`, border → `border-primary` |
| Focus shadow | `shadow-[0_0_0_4px_rgba(0,82,204,0.1)]` |
| Margin | `mt-7` (below sub-headline, above CTAs) |
| Alignment | `mx-auto lg:mx-0` (centered on mobile, left on desktop) |

### CTA Buttons (UNCHANGED layout, stays after search bar)
```html
<div class="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
  <!-- Primary CTA -->
  <MagneticButton href="/courses"
    class="inline-flex items-center justify-center rounded-xl bg-[#0f2747] px-7 py-3.5
           text-sm font-semibold text-white
           shadow-[0_14px_36px_rgba(15,39,71,0.24)]
           transition-transform duration-300 hover:-translate-y-0.5"
    ariaLabel="Browse all courses">
    <span data-hero-reveal="cta">Explore programs</span>
  </MagneticButton>

  <!-- Secondary CTA -->
  <MagneticButton href="/register?mode=instructor"
    class="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300
           bg-white px-7 py-3.5 text-sm font-semibold text-slate-800
           transition-colors duration-300 hover:bg-slate-100"
    ariaLabel="Become an instructor">
    <span data-hero-reveal="cta">Partner as instructor</span>
    <ChevronRight class="h-4 w-4" />
  </MagneticButton>
</div>
```

### Trust Stat Badges (NEW -- row of 3 pills below CTAs)
```html
<div data-hero-reveal="cta"
  class="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
  <!-- Badge 1 -->
  <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200
               bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
    <Users class="h-3.5 w-3.5 text-primary" />
    2.4M+ learners
  </span>
  <!-- Badge 2 -->
  <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200
               bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
    <Building2 class="h-3.5 w-3.5 text-primary" />
    800+ hiring partners
  </span>
  <!-- Badge 3 -->
  <span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200
               bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
    <TrendingUp class="h-3.5 w-3.5 text-primary" />
    92% completion rate
  </span>
</div>
```

| Property | Value |
|---|---|
| Layout | `flex flex-wrap`, `gap-3 sm:gap-4` |
| Each badge | `rounded-full`, `border border-slate-200`, `bg-white/80`, `px-4 py-1.5`, `shadow-sm` |
| Text | `text-sm font-medium text-slate-700` |
| Icon | `h-3.5 w-3.5 text-primary` (lucide: Users, Building2, TrendingUp) |

### Company Text Badges (NEW -- subtle text below stat badges)
```html
<div data-hero-reveal="cta"
  class="mt-5 text-xs text-slate-500">
  Trusted by learners at Google, IBM, Stripe, Shopify, and thousands more.
</div>
```

| Property | Value |
|---|---|
| Font size | `text-xs` (12px) |
| Color | `text-slate-500` |
| Margin-top | `mt-5` |
| Alignment | Inherits from parent (left on lg, center on mobile via parent) |

### Media Card (SIMPLIFIED -- single image, no 3-column grid)
```html
<div data-hero-reveal="media" class="relative mx-auto w-full max-w-2xl">
  <div class="relative overflow-hidden rounded-[24px] border border-slate-200
              bg-white shadow-[0_24px_56px_rgba(15,23,42,0.14)]">
    <!-- Single full image, no bottom grid -->
    <div class="aspect-[4/3] w-full overflow-hidden md:aspect-[16/10]">
      <img
        src="https://picsum.photos/seed/upskill-academic-hero/1200/760"
        alt="Learners participating in a guided classroom session"
        class="h-full w-full object-cover"
        loading="eager"
      />
    </div>
  </div>
  <!-- Floating badge (keep) -->
  <div class="pointer-events-none absolute -right-4 -top-4 hidden rounded-xl
              border border-slate-200 bg-white px-4 py-2 text-xs font-semibold
              uppercase tracking-[0.08em] text-slate-700 shadow-md md:block">
    Institution-ready curriculum
  </div>
</div>
```

| Property | Value |
|---|---|
| Container | `rounded-[24px]`, `border border-slate-200`, `bg-white`, `shadow-[0_24px_56px_rgba(15,23,42,0.14)]` |
| Image aspect | `aspect-[4/3]` mobile, `md:aspect-[16/10]` |
| Image fill | `object-cover`, `w-full h-full` |
| Floating badge | Unchanged position/styling |

### Trust text (REMOVED -- was `data-hero-reveal="cta"` line 138-142)
**Remove** the `mt-8 text-sm text-slate-600` paragraph with "Trusted by learners, instructors..." -- replaced by stat badges + company text.

### Responsive Behavior

| Breakpoint | Layout changes |
|---|---|
| Mobile (<640px) | Single column, center-aligned text, search full-width, CTAs stacked, stat badges wrap |
| Tablet (640-1024px) | Single column, center-aligned, search constrained to `max-w-lg`, CTAs side-by-side |
| Desktop (≥1024px) | Two columns `lg:grid-cols-[1.05fr_0.95fr]`, left-aligned text/cta/search, media right |

### GSAP Animation Attributes (KEEP ALL)
- `data-hero-reveal="tag"` on tag pill
- `data-hero-reveal="title"` with `.line` spans on headline
- `data-hero-reveal="body"` on sub-headline
- `data-hero-reveal="cta"` on search bar, CTA buttons, stat badges, company text
- `data-hero-reveal="media"` on media card
- `data-hero-parallax="layer"` on gradient background div

---

## SECTION 2: CompanyLogosSection (CREATE NEW)

### Section Wrapper
```html
<section id="company-logos"
  data-home-section=""
  class="bg-white py-20 md:py-24">
</section>
```

### Heading Block
```html
<div data-reveal="" class="mb-12 text-center">
  <h2 class="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
    Trusted by over 800 hiring partners
  </h2>
  <p class="mt-4 text-base leading-relaxed text-slate-600">
    Our learners work at leading companies worldwide
  </p>
</div>
```

| Element | Class |
|---|---|
| Heading | `text-3xl md:text-5xl font-semibold tracking-tight text-slate-950` |
| Subtitle | `text-base leading-relaxed text-slate-600 mt-4` |
| Block wrapper | `mb-12 text-center` |

### Company Card Grid
```html
<div data-reveal=""
  class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
         lg:gap-5 xl:gap-6">
  <!-- Repeat for each company -->
</div>
```

| Breakpoint | Columns | Gap |
|---|---|---|
| xs (<640px) | 1 | `gap-4` |
| sm (≥640px) | 2 | `gap-4` |
| md (≥768px) | 3 | `gap-4` |
| lg (≥1024px) | 4 | `gap-5` |
| xl (≥1280px) | 4 | `gap-6` |

### Card Design
```html
<div class="group flex flex-col items-center justify-center rounded-2xl
            border border-slate-200 bg-white px-6 py-8 text-center
            shadow-sm transition-all duration-300
            hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]
            hover:border-slate-300">
  <!-- Logo placeholder -->
  <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl
              bg-slate-100 text-slate-400 transition-colors duration-300
              group-hover:bg-primary/10 group-hover:text-primary">
    <Building2 class="h-7 w-7" />
  </div>
  <!-- Company name -->
  <p class="text-lg font-semibold text-slate-900">Google</p>
  <!-- Industry label -->
  <p class="mt-1 text-sm text-slate-500">Technology</p>
</div>
```

| Property | Value |
|---|---|
| Card base | `rounded-2xl border border-slate-200 bg-white shadow-sm` |
| Padding | `px-6 py-8` |
| Content alignment | `text-center`, `flex flex-col items-center justify-center` |
| Logo container | `h-14 w-14 rounded-xl bg-slate-100`, icon inside |
| Logo icon | `h-7 w-7 text-slate-400` |
| Logo hover | `group-hover:bg-primary/10 group-hover:text-primary` |
| Company name | `text-lg font-semibold text-slate-900` |
| Industry label | `text-sm text-slate-500 mt-1` |
| Card hover | `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)] hover:border-slate-300` |
| Transition | `transition-all duration-300` |

### Company Data
| Name | Industry |
|---|---|
| Google | Technology |
| Meta | Social Media |
| Stripe | Payments |
| Shopify | E-commerce |
| Notion | Productivity |
| Atlassian | Software |
| Canva | Design |
| IBM | Enterprise |

### GSAP Setup
```js
useSectionReveal(sectionRef, { stagger: 0.06 });
```
- First `data-reveal=""`: heading block
- Second `data-reveal=""`: company grid

---

## SECTION 3: FeaturedCoursesSection (KEEP -- NO CHANGES)

Already implemented at `components/home/sections/FeaturedCoursesSection.jsx`. No modifications needed.

---

## SECTION 4: PopularSkillsSection (CREATE NEW)

### Section Wrapper
```html
<section id="popular-skills"
  data-home-section=""
  class="bg-white py-20 md:py-24">
</section>
```

### Heading Block
```html
<div data-reveal="" class="mb-12 max-w-3xl">
  <h2 class="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
    Popular skills to start learning
  </h2>
  <p class="mt-4 text-base leading-relaxed text-slate-600">
    Building in-demand skills that top companies hire for
  </p>
</div>
```

| Element | Class |
|---|---|
| Heading | `text-3xl md:text-5xl font-semibold tracking-tight text-slate-950` |
| Subtitle | `text-base leading-relaxed text-slate-600 mt-4` |
| Block wrapper | `mb-12 max-w-3xl` |

### Skill Card Grid
```html
<div data-reveal=""
  class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
         lg:gap-5">
  <!-- Repeat for each skill -->
</div>
```

| Breakpoint | Columns | Gap |
|---|---|---|
| xs (<640px) | 2 | `gap-4` |
| sm (≥640px) | 3 | `gap-4` |
| lg (≥1024px) | 4 | `gap-5` |
| xl (≥1280px) | 6 | `gap-5` |

### Skill Card Design (clickable Link)
```html
<Link href="/courses?search=React"
  class="group flex flex-col items-center rounded-2xl border border-slate-200
         bg-white px-4 py-6 text-center shadow-sm
         transition-all duration-300
         hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]
         hover:border-primary/30
         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50">
  <!-- Icon circle -->
  <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl
              bg-primary/10 text-primary transition-colors duration-300
              group-hover:bg-primary group-hover:text-white">
    <Code2 class="h-6 w-6" />
  </div>
  <!-- Skill name -->
  <p class="text-base font-semibold text-slate-900">React</p>
  <!-- Course count -->
  <p class="mt-1 text-sm text-slate-500">48 courses</p>
  <!-- Company badge -->
  <span class="mt-3 inline-flex items-center rounded-full border border-slate-200
               bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500">
    Used by Meta, Shopify
  </span>
</Link>
```

| Property | Value |
|---|---|
| Card base | `rounded-2xl border border-slate-200 bg-white shadow-sm` |
| Card padding | `px-4 py-6` |
| Content layout | `flex flex-col items-center text-center` |
| Icon container | `h-12 w-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white` |
| Icon size | `h-6 w-6` (lucide-react) |
| Skill name | `text-base font-semibold text-slate-900 mt-0` (after icon margin) |
| Course count | `text-sm text-slate-500 mt-1` |
| Company badge | `rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 mt-3` |
| Card hover | `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)] hover:border-primary/30` |
| Card focus | `focus:ring-2 focus:ring-primary/30 focus:border-primary/50` |
| Transition | `transition-all duration-300` |

### Skill Data & Icon Mapping
| Skill | lucide Icon | Courses | Companies |
|---|---|---|---|
| React | `Code2` | 48 courses | Used by Meta, Shopify |
| Python | `Terminal` | 56 courses | Used by Google, Netflix |
| Data Analysis | `BarChart3` | 42 courses | Used by Stripe, Amazon |
| UI/UX Design | `Palette` | 35 courses | Used by Canva, Adobe |
| Cloud Computing | `Cloud` | 38 courses | Used by AWS, Azure |
| Machine Learning | `BrainCircuit` | 29 courses | Used by Google, OpenAI |
| Product Management | `KanbanSquare` | 31 courses | Used by Atlassian, Spotify |
| Cybersecurity | `Shield` | 27 courses | Used by Cisco, Palo Alto |
| Mobile Development | `Smartphone` | 33 courses | Used by Meta, Uber |
| DevOps | `Container` | 25 courses | Used by AWS, Docker |
| SQL & Databases | `Database` | 44 courses | Used by Oracle, MongoDB |
| Blockchain | `Hexagon` | 18 courses | Used by Coinbase, Consensys |

### GSAP Setup
```js
useSectionReveal(sectionRef, { stagger: 0.06 });
```
- First `data-reveal=""`: heading block
- Second `data-reveal=""`: skill grid

---

## SECTION 5: StudentSuccessSection (ENHANCE from Testimonials)

### Section Wrapper
```html
<section id="student-success"
  data-home-section=""
  class="overflow-hidden bg-slate-50 py-20 md:py-24">
</section>
```

### Heading Block
```html
<div data-reveal="" class="mb-10 max-w-3xl">
  <h2 class="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
    Learners who changed careers with confidence.
  </h2>
  <p class="mt-4 text-base leading-relaxed text-slate-600">
    Outcomes matter. These stories come from learners who completed
    projects, built portfolios, and moved into new roles.
  </p>
</div>
```

### Carousel Container
```html
<div data-reveal="" class="relative">
  <!-- Scrollable track -->
  <div class="flex snap-x snap-mandatory gap-5 overflow-x-auto
              pb-6 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden"
       role="region" aria-label="Student success stories">
    <!-- Cards -->
  </div>
</div>
```

| Property | Value |
|---|---|
| Track | `flex`, `snap-x snap-mandatory`, `gap-5`, `overflow-x-auto`, `pb-6` |
| Scroll behavior | `scroll-smooth` |
| Hide scrollbar | `[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden` |
| Card snap alignment | `snap-start` (on each card) |

### Testimonial Card Design
```html
<article class="snap-start shrink-0 w-[85vw] sm:w-[70vw] md:w-[45vw] lg:w-[380px]
                rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
                flex flex-col">
  <!-- Top: Photo + Name/Role -->
  <div class="flex items-center gap-3">
    <!-- Round photo placeholder -->
    <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2
                border-slate-200 bg-slate-100">
      <img src="..." alt="Angela Rivera"
           class="h-full w-full object-cover" />
    </div>
    <div>
      <p class="font-semibold text-slate-900">Angela Rivera</p>
      <p class="text-sm text-slate-500">Frontend Engineer, Stripe</p>
    </div>
  </div>

  <!-- Star rating -->
  <div class="mt-3 flex items-center gap-1">
    <!-- 5 filled stars -->
    <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
    <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
    <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
    <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
    <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
    <span class="ml-1.5 text-sm text-slate-500">5.0</span>
  </div>

  <!-- Quote -->
  <blockquote class="mt-3 flex-1 text-sm leading-relaxed text-slate-600
                      before:content-['\201C'] before:mr-0.5
                      after:content-['\201D'] after:ml-0.5
                      before:text-slate-400 after:text-slate-400">
    The project feedback loops changed how I build. I landed interviews
    within six weeks of finishing my path.
  </blockquote>

  <!-- Course link -->
  <Link href="/courses/frontend-engineering"
    class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary
           transition-colors hover:text-primary/80 hover:underline
           focus:outline-none focus:ring-2 focus:ring-primary/30 rounded">
    Frontend Engineering Path
    <ArrowRight class="h-3.5 w-3.5" />
  </Link>
</article>
```

| Element | Class |
|---|---|
| Card width mobile | `w-[85vw]` |
| Card width sm | `sm:w-[70vw]` |
| Card width md | `md:w-[45vw]` (~2 cards visible with gap) |
| Card width lg | `lg:w-[380px]` (fixed 380px) |
| Card base | `snap-start shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm p-6` |
| Card layout | `flex flex-col` |
| Photo container | `h-12 w-12 rounded-full border-2 border-slate-200 bg-slate-100` |
| Photo image | `object-cover h-full w-full` |
| Name | `font-semibold text-slate-900` |
| Role | `text-sm text-slate-500` |
| Star icon | `h-4 w-4 fill-amber-400 text-amber-400` (lucide Star with fill) |
| Star rating text | `text-sm text-slate-500 ml-1.5` |
| Quote | `text-sm leading-relaxed text-slate-600 mt-3 flex-1` |
| Quote marks | `before:content-['\201C'] after:content-['\201D'] text-slate-400` |
| Course link | `text-sm font-medium text-primary hover:text-primary/80 hover:underline mt-4` |
| Course link icon | `ArrowRight`, `h-3.5 w-3.5` |
| Gap between cards | `gap-5` |

### Navigation Arrows
```html
<!-- Left arrow -->
<button aria-label="Previous testimonials"
  class="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2
         hidden md:flex items-center justify-center
         h-10 w-10 rounded-full border border-slate-300 bg-white
         text-slate-600 shadow-md
         transition-all duration-200
         hover:bg-slate-50 hover:text-slate-900 hover:shadow-lg
         focus:outline-none focus:ring-2 focus:ring-primary/30">
  <ChevronLeft class="h-5 w-5" />
</button>

<!-- Right arrow -->
<button aria-label="Next testimonials"
  class="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2
         hidden md:flex items-center justify-center
         h-10 w-10 rounded-full border border-slate-300 bg-white
         text-slate-600 shadow-md
         transition-all duration-200
         hover:bg-slate-50 hover:text-slate-900 hover:shadow-lg
         focus:outline-none focus:ring-2 focus:ring-primary/30">
  <ChevronRight class="h-5 w-5" />
</button>
```

| Property | Value |
|---|---|
| Visibility | `hidden md:flex` (visible only on tablet+) |
| Position left | `left-0 top-1/2 -translate-x-1/2 -translate-y-1/2` |
| Position right | `right-0 top-1/2 translate-x-1/2 -translate-y-1/2` |
| Size | `h-10 w-10` |
| Shape | `rounded-full` |
| Border | `border border-slate-300` |
| Background | `bg-white` |
| Color | `text-slate-600` |
| Shadow | `shadow-md` |
| Hover | `hover:bg-slate-50 hover:text-slate-900 hover:shadow-lg` |
| Focus | `focus:ring-2 focus:ring-primary/30` |
| Icon | `ChevronLeft`/`ChevronRight`, `h-5 w-5` |

### Dot Indicators
```html
<div class="mt-6 flex items-center justify-center gap-2" role="tablist"
     aria-label="Testimonial navigation">
  <!-- Active dot -->
  <button aria-selected="true" role="tab"
    class="h-2.5 w-2.5 rounded-full bg-primary transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-primary/30" />
  <!-- Inactive dot -->
  <button aria-selected="false" role="tab"
    class="h-2 w-2 rounded-full bg-slate-300 transition-all duration-200
           hover:bg-slate-400
           focus:outline-none focus:ring-2 focus:ring-primary/30" />
  <!-- ... repeat for each slide ... -->
</div>
```

| Property | Value |
|---|---|
| Container | `mt-6 flex justify-center gap-2` |
| Active dot | `h-2.5 w-2.5 rounded-full bg-primary` |
| Inactive dot | `h-2 w-2 rounded-full bg-slate-300 hover:bg-slate-400` |
| Focus | `focus:ring-2 focus:ring-primary/30` |
| Transition | `transition-all duration-200` |

### Student Data (6 stories)
| Name | Role | Rating | Course | Quote |
|---|---|---|---|---|
| Angela Rivera | Frontend Engineer, Stripe | 5.0 | Frontend Engineering Path | The project feedback loops changed how I build. I landed interviews within six weeks of finishing my path. |
| Noah Patel | Data Analyst, Canva | 5.0 | Data Analytics Bootcamp | I finally understood how to connect analytics concepts to business decisions. The mentor support was excellent. |
| Mina Okafor | Product Designer, Atlassian | 5.0 | Product Design Mastery | Each module felt practical and current. My capstone became a portfolio case study that recruiters actually asked about. |
| James Chen | ML Engineer, Google | 5.0 | Machine Learning Nanodegree | The hands-on projects with real datasets gave me the confidence to apply for ML roles. Landed at Google within 3 months. |
| Sarah Williams | UX Lead, Meta | 5.0 | UX Research & Strategy | The user research frameworks I learned are exactly what I use daily. Best career investment I've ever made. |
| David Okonkwo | DevOps Engineer, AWS | 4.9 | Cloud DevOps Certification | From zero cloud experience to AWS DevOps Engineer. The labs and practice exams were incredibly thorough. |

### Responsive Behavior
| Breakpoint | Cards visible | Navigation arrows | Dots |
|---|---|---|---|
| Mobile (<640px) | 1 (full width with edge peek) | Hidden | Shown |
| Tablet (640-1024px) | 1.5 (partial peek of next card) | Hidden | Shown |
| Desktop (≥1024px) | 2 (380px each + gap) | Shown (on sides) | Shown |

### GSAP Setup
```js
useSectionReveal(sectionRef, { stagger: 0.1 });
```
- First `data-reveal=""`: heading block
- Second `data-reveal=""`: carousel container (including nav + dots)

### JS Behavior (to be implemented in component)
- Arrow clicks: scroll carousel by `cardWidth + gap` pixels
- Dot clicks: scroll to corresponding `snap-start` card
- Scroll event listener: update active dot based on which card is in view (IntersectionObserver on each card's intersectionRatio threshold)
- Keyboard: left/right arrow keys scroll the carousel

---

## SECTION 6: CategoriesSection (KEEP -- NO CHANGES)

Already implemented at `components/home/sections/CategoriesSection.jsx`. No modifications needed.

---

## SECTION 7: CertificationPrepSection (CREATE NEW)

### Section Wrapper
```html
<section id="certification-prep"
  data-home-section=""
  class="bg-slate-50 py-20 md:py-24">
</section>
```

### Heading Block
```html
<div data-reveal="" class="mb-12 max-w-3xl">
  <h2 class="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
    Prepare for industry-recognized certifications
  </h2>
  <p class="mt-4 text-base leading-relaxed text-slate-600">
    Comprehensive prep paths with practice exams and expert-led courses
  </p>
</div>
```

### Cert Card Grid
```html
<div data-reveal=""
  class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3
         lg:gap-6">
  <!-- Repeat for each certification -->
</div>
```

| Breakpoint | Columns | Gap |
|---|---|---|
| xs (<768px) | 1 | `gap-5` |
| md (≥768px) | 2 | `gap-5` |
| lg (≥1024px) | 3 | `gap-6` |

### Certification Card Design
```html
<Link href="/certifications/comptia-a-plus"
  class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6
         shadow-sm
         transition-all duration-300
         hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]
         hover:border-slate-300
         focus:outline-none focus:ring-2 focus:ring-primary/30">
  <!-- Badge icon area -->
  <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-xl
              bg-rose-100 text-rose-600">
    <span class="text-xl font-bold tracking-tight">A+</span>
  </div>

  <!-- Cert name -->
  <h3 class="text-lg font-semibold text-slate-900">CompTIA A+</h3>

  <!-- Description -->
  <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
    Foundational IT certification covering hardware, networking, and troubleshooting for entry-level IT roles.
  </p>

  <!-- Bottom row: course count + CTA -->
  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
    <!-- Course count badge -->
    <span class="inline-flex items-center rounded-full border border-slate-200
                 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
      12 courses
    </span>
    <!-- CTA -->
    <span class="inline-flex items-center gap-1 text-sm font-medium text-primary
                 transition-colors group-hover:text-primary/80">
      Start path
      <ArrowRight class="h-4 w-4 transition-transform duration-200
                       group-hover:translate-x-0.5" />
    </span>
  </div>
</Link>
```

| Property | Value |
|---|---|
| Card base | `rounded-2xl border border-slate-200 bg-white shadow-sm p-6` |
| Card layout | `flex flex-col` |
| Badge container | `mb-5 h-16 w-16 rounded-xl` |
| Badge text (initials) | `text-xl font-bold tracking-tight` |
| Cert name | `text-lg font-semibold text-slate-900` |
| Description | `text-sm leading-relaxed text-slate-600 mt-2 flex-1` |
| Bottom row | `mt-4 flex items-center justify-between border-t border-slate-100 pt-4` |
| Course count badge | `rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600` |
| CTA link | `text-sm font-medium text-primary group-hover:text-primary/80` |
| CTA arrow | `ArrowRight h-4 w-4 group-hover:translate-x-0.5` |
| Card hover | `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]` |
| Transition | `transition-all duration-300` |

### Certification Data & Badge Colors
| Certification | Badge BG | Badge Text | Badge Label | Description | Courses |
|---|---|---|---|---|---|
| CompTIA A+ | `bg-rose-100` | `text-rose-600` | `A+` | Foundational IT certification covering hardware, networking, and troubleshooting for entry-level IT roles. | 12 courses |
| AWS Cloud Practitioner | `bg-amber-100` | `text-amber-600` | `AWS` | Validate cloud fluency and foundational AWS knowledge for technical and non-technical roles. | 18 courses |
| PMP | `bg-blue-100` | `text-blue-600` | `PMP` | Project Management Professional certification for experienced project managers leading cross-functional teams. | 8 courses |
| Google Data Analytics | `bg-emerald-100` | `text-emerald-600` | `GDA` | End-to-end data analytics certification covering collection, transformation, and visualization. | 15 courses |
| Azure Fundamentals | `bg-sky-100` | `text-sky-600` | `AZ` | Microsoft Azure cloud services basics including compute, storage, and networking fundamentals. | 14 courses |
| Cisco CCNA | `bg-indigo-100` | `text-indigo-600` | `CCNA` | Cisco Certified Network Associate covering network access, IP connectivity, and security fundamentals. | 10 courses |

### GSAP Setup
```js
useSectionReveal(sectionRef, { stagger: 0.08 });
```
- First `data-reveal=""`: heading block
- Second `data-reveal=""`: certification grid

---

## SECTION 8: FinalCTA (KEEP -- NO CHANGES)

Already implemented at `components/blocks/FinalCTA.jsx`. No modifications needed.

---

## Import Reference per Section

### Section 1 (HomeHeroSection)
```
lucide-react: Search, Users, Building2, TrendingUp, GraduationCap, ChevronRight
(keep existing imports)
```

### Section 2 (CompanyLogosSection)
```
lucide-react: Building2
```

### Section 4 (PopularSkillsSection)
```
lucide-react: Code2, Terminal, BarChart3, Palette, Cloud, BrainCircuit,
              KanbanSquare, Shield, Smartphone, Container, Database, Hexagon
```

### Section 5 (StudentSuccessSection)
```
lucide-react: Star, ArrowRight, ChevronLeft, ChevronRight
```

### Section 7 (CertificationPrepSection)
```
lucide-react: ArrowRight
```

---

## Order of Sections on Homepage (final)

| # | Section | Status | Background |
|---|---|---|---|
| 1 | `HomeHeroSection` | MODIFIED | `bg-slate-50` |
| 2 | `CompanyLogosSection` | NEW | `bg-white` |
| 3 | `FeaturedCoursesSection` | KEPT | `bg-slate-50` |
| 4 | `PopularSkillsSection` | NEW | `bg-white` |
| 5 | `StudentSuccessSection` | ENHANCED | `bg-slate-50` |
| 6 | `CategoriesSection` | KEPT | `bg-white` |
| 7 | `CertificationPrepSection` | NEW | `bg-slate-50` |
| 8 | `FinalCTA` | KEPT | `bg-slate-50` |
