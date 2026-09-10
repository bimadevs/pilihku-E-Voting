# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students / Voters (Siswa SMP/SMA/SMK)**: Voting in the annual school OSIS election. Using personal smartphones or shared computers in school computer labs during active voting sessions. Need a frictionless, transparent, and trustworthy voting experience without technical confusion.
- **Election Committee & School Admin (Panitia Pemilihan OSIS & Pembina)**: School teachers and OSIS organizers managing election candidates, importing student rosters via CSV, monitoring real-time voting participation, enforcing voting deadlines, and publishing winner announcements.

## Product Purpose

PilihKu provides a modern, transparent, and accessible e-voting platform tailored for Indonesian school OSIS elections. It replaces manual paper ballots with a secure digital election system that prevents double-voting, ensures ballot privacy, and delivers real-time election results and celebratory winner reveals. Success means 100% election integrity, zero student confusion during voting, and hassle-free election administration.

## Positioning

Unlike complex enterprise voting systems or generic survey tools (like Google Forms), PilihKu is specifically designed for Indonesian school OSIS elections with native student NIS authentication, paired candidate profiles (Ketua & Wakil with class, vision, mission, and work programs), strict one-student-one-vote safeguards, and built-in ceremonial countdown and winner reveal announcements.

## Operating Context

- **Voting Day in School**: High-volume, time-constrained voting during designated class shifts or homeroom periods. Devices range from mid-to-low tier mobile browsers on school Wi-Fi/cellular data to lab desktop browsers.
- **Admin Control Room**: Panitia and teachers running candidate management, tracking live turnout rates, printing election verification summaries, and projecting the countdown winner announcement on school projectors or auditoriums.
- **Language & Cultural Context**: Bahasa Indonesia terminology throughout (`NIS`, `Ketua OSIS`, `Wakil Ketua OSIS`, `Visi`, `Misi`, `Program Kerja`, `Suara Masuk`).

## Capabilities and Constraints

- **Authentication**: NIS-based login for voters (authenticated against voter roster), session token and credential-based login for administrators.
- **Single Vote Enforcement**: Database constraint and boolean flag (`has_voted`) preventing double-voting; once a vote is cast and confirmed, it cannot be edited or undone.
- **Candidate Presentation**: Paired candidates (Ketua & Wakil) displaying numbers, names, classes, photos, vision, mission, and work programs (`program_kerja`).
- **Real-time Monitoring & Export**: Real-time vote count tracking and participation charts, CSV voter import, CSV results export, and printable report view.
- **Announcement & Schedule Control**: Admin-configured election schedule (`voting_schedule`), announcement timer countdown, winner declaration with animations/confetti.
- **Technical Stack Constraints**: Next.js App Router, Tailwind CSS, Framer Motion, Supabase backend with Row Level Security (RLS) policies.

## Brand Commitments

- **Name**: PilihKu (PilihKu - Sistem E-Voting OSIS).
- **Tone & Voice**: Formal yet youth-friendly, encouraging democratic participation, clear, honest, and reassuring.

## Evidence on Hand

- Complete database schema definitions in [README.md](file:///home/bimadev/project/hermes/antigravity/pilihku-E-Voting/README.md) (`voters`, `candidates`, `votes`, `voting_schedule`, `settings`, and Supabase storage bucket `candidate-photos`).
- Implemented routes in codebase: `/` (NIS login & public info), `/vote` (voting surface), `/admin` (dashboard, candidates, voters, settings, announcement).
- Sample CSV import/export data specifications in documentation.

## Product Principles

1. **Unquestionable Integrity**: Every student gets exactly one vote; ballot integrity and voter verification must be obvious, reassuring, and verifiable.
2. **Effortless Simplicity**: Voting is completed in three clear steps (Login with NIS -> Review Candidates -> Confirm Choice) with zero cognitive friction on small mobile screens.
3. **Transparent Administration**: Real-time turnout tracking and clear audit metrics for panitia without compromising ballot secrecy.
4. **Ceremony and Celebration**: Foster excitement around student democracy with engaging countdowns and winner reveals.

## Accessibility & Inclusion

- Responsive design supporting varied mobile viewport sizes (360px+) and low-resource school desktop screens.
- High color contrast for legibility under bright classroom or outdoor lighting.
- Clear visual cues and touch targets suitable for varied motor accessibility and touch devices.
