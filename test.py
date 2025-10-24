
from reportlab.lib.pagesizes import LETTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib import colors

# Helper for hyperlink
def link(url, text=None):
    if text is None:
        text = url
    return f'<link href="{url}">{text}</link>'

# Build base styles
ss = getSampleStyleSheet()

styles = {
    "name": ParagraphStyle(
        "name", parent=ss["Heading1"], fontName="Helvetica-Bold",
        fontSize=22, leading=26, spaceAfter=6
    ),
    "tagline": ParagraphStyle(
        "tagline", parent=ss["Heading3"], fontName="Helvetica",
        fontSize=11.5, textColor=colors.HexColor("#333333"),
        leading=16, spaceAfter=8
    ),
    "contact": ParagraphStyle(
        "contact", parent=ss["BodyText"], fontName="Helvetica",
        fontSize=10.5, leading=15, textColor=colors.HexColor("#222222"),
        spaceAfter=2
    ),
    "h1": ParagraphStyle(
        "h1", parent=ss["Heading2"], fontName="Helvetica-Bold",
        fontSize=14.5, leading=18, spaceBefore=10, spaceAfter=8,
        textColor=colors.HexColor("#000000")
    ),
    "h2": ParagraphStyle(
        "h2", parent=ss["Heading3"], fontName="Helvetica-Bold",
        fontSize=12.5, leading=16, spaceBefore=8, spaceAfter=6,
        textColor=colors.HexColor("#000000")
    ),
    "h3": ParagraphStyle(
        "h3", parent=ss["Heading4"], fontName="Helvetica-Bold",
        fontSize=11.5, leading=15, spaceBefore=6, spaceAfter=4,
        textColor=colors.HexColor("#000000")
    ),
    "body": ParagraphStyle(
        "body", parent=ss["BodyText"], fontName="Helvetica",
        fontSize=10.5, leading=15, spaceAfter=6
    ),
    "bullet": ParagraphStyle(
        "bullet", parent=ss["BodyText"], fontName="Helvetica",
        fontSize=10.5, leading=15, leftIndent=4, spaceAfter=3
    ),
    "role": ParagraphStyle(
        "role", parent=ss["Heading3"], fontName="Helvetica-Bold",
        fontSize=12.5, leading=16, spaceBefore=8, spaceAfter=1
    ),
    "meta": ParagraphStyle(
        "meta", parent=ss["BodyText"], fontName="Helvetica-Oblique",
        fontSize=10.5, leading=14, textColor=colors.HexColor("#444444"),
        spaceAfter=4
    ),
}

elements = []

# ----------------------
# Header
# ----------------------
elements.append(Paragraph("Torrin Leonard | Full Stack Software Developer", styles["name"]))
elements.append(Paragraph("AI & UI Specialist • Web App Architect • Open-Source Contributor", styles["tagline"]))

# Contact lines
elements.append(Paragraph("Located Waterloo, Ontario, Canada · 8+ years professional experience", styles["contact"]))
elements.append(
    Paragraph(
        f"Email: {link('mailto:torrin@torrin.me', 'torrin@torrin.me')} · "
        f"Website: {link('https://torrin.me', 'torrin.me')}",
        styles["contact"]
    )
)
elements.append(
    Paragraph(
        f"LinkedIn: {link('https://www.linkedin.com/in/torrin-leonard-8343a1154/', 'linkedin.com/in/torrin-leonard-8343a1154')} · "
        f"GitHub: {link('https://github.com/torrinworx', 'github.com/torrinworx')} · "
        f"GitLab: {link('https://gitlab.com/torrin1', 'gitlab.com/torrin1')}",
        styles["contact"]
    )
)

elements.append(Spacer(1, 6))
elements.append(HRFlowable(color=colors.HexColor("#CCCCCC"), thickness=0.6, width="100%"))
elements.append(Spacer(1, 6))

# ----------------------
# Summary
# ----------------------
elements.append(Paragraph("Summary", styles["h1"]))
summary_text = (
    "Full-stack developer with 8+ years of professional experience spanning startups, contract work, and open-source "
    "contributions. Mentored by senior engineers and experienced in working on larger codebases, code review, and "
    "collaborative product development. Skilled in building production-grade web apps, automation pipelines, and custom "
    "UI frameworks with a focus on performance, accessibility, and scalability. Thrives in environments where design and "
    "technical decisions intersect, driving projects from concept to deployment."
)
elements.append(Paragraph(summary_text, styles["body"]))

elements.append(Spacer(1, 4))
elements.append(HRFlowable(color=colors.HexColor("#EEEEEE"), thickness=0.6, width="100%"))
elements.append(Spacer(1, 4))

# ----------------------
# Skills
# ----------------------
elements.append(Paragraph("Skills", styles["h1"]))

skills_data = [
    (
        "Frontend",
        "React, Three.js, WebGL, Vite, Custom UI libraries, Accessibility (WCAG)"
    ),
    (
        "Backend",
        "Node.js, Express, Django, FastAPI, Go, Rust"
    ),
    (
        "Databases",
        "MongoDB, MariaDB, CockroachDB, Arweave"
    ),
    (
        "DevOps",
        "GitHub Actions, Docker, GitLab CI/CD, NGINX, Linux (Ubuntu/Arch), DigitalOcean, AWS"
    ),
    (
        "Testing",
        "TestCafe, manual + cross-browser QA, accessibility audits"
    ),
    (
        "AI/ML",
        "OpenAI API, Hugging Face, Qdrant, Whisper, Ollama"
    ),
    (
        "Other",
        "Bash scripting, Blockchain dev (Ethereum, Polygon, Cardano), sprint planning, mentorship"
    ),
]

skills_listitems = []
for title, desc in skills_data:
    bullet_paragraph = Paragraph(f"<b>{title}:</b> {desc}", styles["body"])
    skills_listitems.append(ListItem(bullet_paragraph, leftIndent=4))

elements.append(
    ListFlowable(
        skills_listitems,
        bulletType="bullet",
        start="•",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=9
    )
)

elements.append(Spacer(1, 4))
elements.append(HRFlowable(color=colors.HexColor("#EEEEEE"), thickness=0.6, width="100%"))
elements.append(Spacer(1, 4))

# ----------------------
# Highlights
# ----------------------
elements.append(Paragraph("Highlights", styles["h1"]))
highlights_texts = [
    "<b>OpenGig.org (Open Source, from scratch)</b> – Architected and launched a full-stack cooperative gig platform in pure JavaScript (frontend + backend) with MongoDB. Custom Vite + Bash build system, GitHub Actions CI, and bare-metal deployment to a DigitalOcean Droplet connected to a managed DigitalOcean MongoDB. Integrated my destam-web-core and destamatic-ui libraries; runs without Docker for lean, fast deploys.",
    "<b>AI-Driven Proposal Product</b> – Built from scratch and deployed a full stack AI proposal product that automated client proposals creation.",
    "<b>Open-Source Plugins</b> – Creator of Blend_My_NFTs (1,000+ GitHub stars), used by dozens of NFT projects and studios worldwide. Engauged with users and created YouTube tutorials with 200,000+ channel views.",
    "<b>Reusable UI Frameworks</b> – Developed UI components that significantly reduced feature delivery time across Equator Studios' GIS and AI interfaces.",
    "<b>Mentorship & Collaboration</b> – Mentored junior engineers, improved onboarding workflows, and participated in peer code reviews to raise team code quality.",
    "<b>Startup & Client Experience</b> – Co-founded a creative engineering studio, shipped multiple NFT collections, and worked with clients across Web3 and SaaS.",
]

hl_listitems = []
for ht in highlights_texts:
    hl_listitems.append(ListItem(Paragraph(ht, styles["body"]), leftIndent=4))

elements.append(
    ListFlowable(
        hl_listitems,
        bulletType="bullet",
        start="•",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=9
    )
)

elements.append(Spacer(1, 4))
elements.append(HRFlowable(color=colors.HexColor("#EEEEEE"), thickness=0.6, width="100%"))
elements.append(Spacer(1, 4))

# ----------------------
# Experience
# ----------------------
elements.append(Paragraph("Experience", styles["h1"]))

def add_role(title, meta, bullets):
    elements.append(Paragraph(title, styles["role"]))
    elements.append(Paragraph(meta, styles["meta"]))
    if bullets:
        bullet_items = []
        for b in bullets:
            bullet_items.append(ListItem(Paragraph(b, styles["body"]), leftIndent=4))
        elements.append(
            ListFlowable(
                bullet_items,
                bulletType="bullet",
                start="•",
                leftIndent=10,
                bulletFontName="Helvetica",
                bulletFontSize=9
            )
        )
    elements.append(Spacer(1, 4))

# Equator Studios
eq_bullets = [
    "Led development of an AI-driven proposal generation tool; integrated ChatGPT and vector search, reducing manual proposal work.",
    "Designed and deployed internal and production infrastructure (CI/CD pipelines, Dockerized services, GitLab CI/CD) to ensure reliable deployments.",
    "Built a reusable UI framework for GIS mapping and AI apps, cutting frontend development time and improving reactivity, performance, and load times.",
    "Collaborated with senior devs, participated in code reviews, and mentored junior engineers to raise overall code quality and process maturity.",
    "Implemented Stripe payments and managed server/domain configuration, uptime monitoring, and security compliance.",
]

add_role(
    "Full Stack Software Developer — Equator Studios",
    "March 2023 – Present | Hybrid / Waterloo, ON",
    eq_bullets
)

# Cozy Studio
cozy_bullets = [
    "Built and maintained NFT generation pipelines (rendering, storage, minting); used in 5+ large-scale NFT drops.",
    "Created Blend_My_NFTs (1,000+ GitHub stars), adopted by creators and Web3 teams worldwide.",
    "Managed product roadmaps, client communications, and automated production workflows with Python, reducing manual work.",
    "Led a small engineering and 3D modeling team and directed technical architecture decisions.",
]
add_role(
    "Co-Founder, CEO, Lead Developer — This Cozy Studio Inc.",
    "October 2021 – January 2025 | Waterloo, ON",
    cozy_bullets
)

# League
league_bullets = [
    "Wrote and maintained TestCafe automation suites (TypeScript/JS) to support CI pipelines, reducing regression bugs between releases.",
    "Partnered with product managers and engineers to prioritize fixes and ship accessible (WCAG-compliant) releases.",
    "Improved team velocity by automating repetitive regression testing and triaging defects.",
]
add_role(
    "QA, Accessibility & Automation Tester — League",
    "March 2021 – May 2022 | Remote",
    league_bullets
)

# Pivot Careers
pivot_bullets = [
    "Designed and validated an employee onboarding and training platform via user interviews and prototyping.",
    "Automated early course creation flows and built wireframes, laying groundwork for MVP development.",
]
add_role(
    "Founder & CEO — Pivot Careers",
    "August 2020 – October 2021 | Waterloo, ON",
    pivot_bullets
)

# TunnelBear
tunnelbear_bullets = [
    "Tested VPN and password manager products across platforms; authored clear bug reports and verified security/UX issues pre-release.",
    "Collaborated with engineers and PMs to ensure smooth, high-quality releases.",
]
add_role(
    "Software QA Tester — TunnelBear",
    "April 2017 – February 2021 | Remote / Toronto",
    tunnelbear_bullets
)

# worX4you
worx_bullets = [
    "Delivered QA and automation services to startups (THRILLWORKS, League, TunnelBear, Hubba, Hopscotch).",
    "Gained early exposure to startup operations, product lifecycles, and agile methodologies while performing test automation and accessibility audits.",
]
add_role(
    "Software Assurance Engineer — worX4you Inc.",
    "June 2013 – June 2025 | Contract / Various Clients",
    worx_bullets
)

elements.append(HRFlowable(color=colors.HexColor("#EEEEEE"), thickness=0.6, width="100%"))
elements.append(Spacer(1, 4))

# ----------------------
# Education
# ----------------------
elements.append(Paragraph("Education", styles["h1"]))

elements.append(Paragraph("University of Waterloo — Honours Co-op, Astronomy & Physics", styles["role"]))
elements.append(Paragraph("Expected Jun 2026", styles["meta"]))

elements.append(Paragraph("Laurel Heights Secondary School (formerly Sir John A. Macdonald)", styles["role"]))
elements.append(Paragraph("Graduated Jun 2021", styles["meta"]))

elements.append(Spacer(1, 4))
elements.append(HRFlowable(color=colors.HexColor("#EEEEEE"), thickness=0.6, width="100%"))
elements.append(Spacer(1, 4))

# ----------------------
# Extras
# ----------------------
elements.append(Paragraph("Extras", styles["h1"]))
elements.append(Paragraph("Notable Open-Source & Personal Projects", styles["h2"]))

# 1) OpenGig.org
elements.append(Paragraph("<b>OpenGig.org — Open-source cooperative service platform for gig workers and customers</b>", styles["body"]))
elements.append(
    Paragraph(
        f"Repo: {link('https://github.com/torrinworx/OpenGig.org', 'github.com/torrinworx/OpenGig.org')} · "
        f"Live: {link('https://OpenGig.org', 'OpenGig.org')}",
        styles["body"]
    )
)
open_gig_points = [
    "Built from scratch as a full-stack pure JavaScript app (frontend + backend) backed by MongoDB.",
    "Architecture: custom Bash build script using Vite; runs on bare metal without Docker for lean, fast deploys.",
    "CI/CD: GitHub Actions workflow builds and deploys via custom scripts.",
    "Infra: Deployed to a DigitalOcean Droplet and linked to a managed DigitalOcean MongoDB instance; served behind NGINX.",
    "Codebase integrates my libraries: destam-web-core (state sync, websocket auth, backend routing) and destamatic-ui (custom UI + DOM reactivity).",
    "Project embodies Open Source Service principles (open code, transparent costs/metrics, and community-driven governance).",
]
elements.append(
    ListFlowable(
        [ListItem(Paragraph(p, styles["body"]), leftIndent=4) for p in open_gig_points],
        bulletType="bullet",
        start="•",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=9
    )
)
elements.append(Spacer(1, 3))

# 2) Blend_My_NFTs
elements.append(Paragraph("<b>Blend_My_NFTs (Blender add-on)</b> — Blender plugin to procedurally generate and pipeline 3D NFTs (1,000+ stars on GitHub).", styles["body"]))
elements.append(Spacer(1, 3))

# 3) destam web core
elements.append(Paragraph("<b>destam web core</b> — Full-stack state syncing, websocket auth, and backend routing core library.", styles["body"]))
elements.append(Spacer(1, 3))

# 4) destamatic-ui
elements.append(Paragraph("<b>destamatic-ui</b> — Custom UI + DOM reactivity libraries used across portfolio and projects.", styles["body"]))
elements.append(Spacer(1, 3))

# 5) MangoSync
elements.append(Paragraph("<b>MangoSync</b> — Local music player with Whisper-based auto-lyrics transcription and enhanced metadata.", styles["body"]))
elements.append(Spacer(1, 3))

# 6) torrin.me
elements.append(
    Paragraph(
        f"<b>torrin.me</b> — Custom UI + WebGL portfolio site with real-time theming and blogging engine "
        f"({link('https://torrin.me', 'torrin.me')}).",
        styles["body"]
    )
)
elements.append(Spacer(1, 3))

# 7) Bitorch
elements.append(Paragraph("<b>Bitorch</b> — Open Source Distributed AI Inference Network", styles["body"]))
bitorch_details = [
    "Developed and tested FastAPI backend components, inference endpoints, and environment config scripts.",
    "Set up and managed local Docker instances to run AI models for proof-of-concept distributed inference.",
]
elements.append(
    ListFlowable(
        [ListItem(Paragraph(p, styles["body"]), leftIndent=4) for p in bitorch_details],
        bulletType="bullet",
        start="•",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=9
    )
)
elements.append(Spacer(1, 3))

# Certifications & Courses
elements.append(Paragraph("Certifications & Courses", styles["h2"]))
certs = [
    "Harverd CS50 Introduction to Computer Science",
    "W3Cx Web Accessibility",
    "MIT 16.00x Intro to Aerospace",
    "ANU-ASTRO1x Mysteries of the Universe",
    "St. John Ambulance Emergency First Aid + CPR",
]
elements.append(
    ListFlowable(
        [ListItem(Paragraph(c, styles["body"]), leftIndent=4) for c in certs],
        bulletType="bullet",
        start="•",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=9
    )
)

elements.append(Spacer(1, 4))

# ----------------------
# Build PDF
# ----------------------
filename = "Torrin_Leonard_Resume.pdf"
doc = SimpleDocTemplate(
    filename,
    pagesize=LETTER,
    leftMargin=54,
    rightMargin=54,
    topMargin=54,
    bottomMargin=54
)

doc.build(elements)
