import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import { Separator } from "@/components/ui/separator";
import {
  PROFILE,
  SKILLS,
  WORK_EXPERIENCE,
  EDUCATION,
} from "@/lib/resume-data";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

const RESUME_URL = process.env.NEXT_PUBLIC_RESUME_URL ?? "/karan-kumar-resume.pdf";

export const metadata: Metadata = {
  title: "Resume | Karan Kumar",
  description:
    "Resume and work experience of Karan Kumar. Digital Strategist — paid media, SEO, Webflow, analytics. Developed The Stash with AI.",
  alternates: { canonical: `${BASE_URL}/resume` },
  robots: { index: true, follow: true },
};

const breadcrumbItems = [
  { name: "The Stash", url: `${BASE_URL}/` },
  { name: "Resume", url: `${BASE_URL}/resume` },
];

export default function ResumePage() {
  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-3xl w-full px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "Resume" }]}
            className="mb-6"
          />

          {/* Header */}
          <header>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {PROFILE.name}
            </h1>
            <p className="mt-1 text-lg font-medium text-muted-foreground">
              {PROFILE.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {PROFILE.location}
              {PROFILE.phone && ` · ${PROFILE.phone}`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <a
                href={`mailto:${PROFILE.email}`}
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                {PROFILE.email}
              </a>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This site was developed by Karan Kumar and AI.
            </p>
          </header>

          <Separator className="my-8" />

          {/* Profile */}
          <section aria-labelledby="profile-heading">
            <h2
              id="profile-heading"
              className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Profile
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {PROFILE.summary.map((para, i) => (
                <li key={i}>{para}</li>
              ))}
            </ul>
          </section>

          <Separator className="my-8" />

          {/* Skills */}
          <section aria-labelledby="skills-heading">
            <h2
              id="skills-heading"
              className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Skills
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              {SKILLS.map((skill, i) => (
                <li key={i} className="list-disc pl-1">
                  {skill}
                </li>
              ))}
            </ul>
          </section>

          <Separator className="my-8" />

          {/* Work experience — reverse chronological */}
          <section aria-labelledby="experience-heading">
            <h2
              id="experience-heading"
              className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Employment history
            </h2>
            <ul className="mt-6 space-y-8">
              {WORK_EXPERIENCE.map((job) => (
                <li key={job.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {job.companyName}
                      {job.location && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {job.location}
                        </span>
                      )}
                    </h3>
                    {job.isCurrentEmployer && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  {job.positions.map((pos) => (
                    <div key={pos.id} className="mt-2">
                      <p className="text-sm font-medium text-foreground">
                        {pos.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pos.employmentPeriod}
                        {pos.employmentType && ` · ${pos.employmentType}`}
                      </p>
                      {"description" in pos && pos.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {pos.description}
                        </p>
                      )}
                      {pos.highlights && pos.highlights.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {pos.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </section>

          <Separator className="my-8" />

          {/* Education */}
          <section aria-labelledby="education-heading">
            <h2
              id="education-heading"
              className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Education
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {EDUCATION.map((edu, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">
                    {edu.institution}
                  </span>
                  {" — "}
                  {edu.qualification}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={RESUME_URL}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              View / download PDF resume
            </Link>
            <Link
              href="/"
              className="text-sm text-foreground underline underline-offset-2 hover:text-primary"
            >
              Back to The Stash
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
