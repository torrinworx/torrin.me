from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    ListFlowable,
)
from reportlab.lib.units import inch

OUTPUT_FILE = "Torrin_Leonard_Resume.pdf"

NAME = "Torrin Leonard"
TITLE = "Full-Stack Software Engineer"

LOCATION = "Waterloo, Ontario, Canada"
YEARS_EXP = "9+ years professional experience"
EMAIL = "torrin@torrin.me"
WEBSITE = "https://torrin.me"
GITHUB = "https://github.com/torrinworx"
LINKEDIN = "https://www.linkedin.com/in/torrin-leonard-8343a1154/"

# --- CONTENT (kept close to your Landing.jsx) --- #

SUMMARY = """
Full-stack software engineer focused on AI-powered web apps, vector search pipelines, and
accessible UI systems (WCAG). Comfortable owning 0->1 product features end-to-end, collaborating
with cross-functional teams, and shipping to production in fast-paced environments.
"""

POSITIONS = [
    {
        "role": "Full Stack Software Developer",
        "company": "Equator Studios",
        "location": "Hybrid / Waterloo, ON",
        "dates": "Mar 2023 – Present",
        "tech": "Node.js/Express, React + destamatic-ui, TypeScript, MongoDB, Python/FastAPI, OpenAI (embeddings + fine-tuning), Qdrant, ChromaDB, GeoPandas, Docker, GitLab CI/CD, GitHub Actions, DigitalOcean, AWS, Proxmox, Linux",
        "bullets": [
            "Owned 0->1 AI proposal product end-to-end and shipped to production as sole engineer.",
            "Built vector ingestion + retrieval pipeline with OpenAI embeddings, Qdrant, and ChromaDB; integrated into our main application.",
            "Implemented client fine-tuning pipeline with OpenAI fine-tuning API and productionized services.",
            "Integrated server-hosted GIS segmentation models for satellite imagery selection in the main app.",
            "Expanded Stripe integrations and supported site-based pricing rollout with product.",
            "Onboarded and mentored 2 developers; participated in interviews and code reviews.",
        ],
    },
    {
        "role": "Co-Founder, CEO, Lead Developer",
        "company": "This Cozy Studio Inc.",
        "location": "Waterloo, ON",
        "dates": "Oct 2021 – Jan 2025",
        "tech": "React, Node.js, Django, Python, Blender API, HTML/CSS/JavaScript, AWS",
        "bullets": [
            "Led client-facing delivery for 3D/NFT pipeline projects; scoped contracts, managed timelines, and shipped quickly.",
            "Built and maintained Blend_My_NFTs (Python/Blender API), reaching ~1k GitHub stars.",
            "Developed web tooling for asset pipelines and automated rendering/export workflows.",
            "Coordinated 3D asset pipeline standards with studio collaborators to improve consistency and delivery quality.",
        ],
    },
    {
        "role": "Automation & Accessibility Engineer (Contract / Part-time)",
        "company": "League",
        "location": "Remote",
        "dates": "Mar 2021 – May 2022",
        "tech": "JavaScript/TypeScript, TestCafe, Node/npm, Git, Jira, WCAG",
        "bullets": [
            "Built TestCafe regression suites in TypeScript/JavaScript, reducing manual cycles and improving release confidence.",
            "Performed WCAG accessibility audits and partnered with engineers/PMs to ship compliant releases.",
            "Maintained automation and triaged defects within CI workflows.",
        ],
    },
    {
        "role": "Automation & Accessibility Engineer (Contract / Part-time)",
        "company": "worX4you Inc.",
        "location": "Contract / Various Clients",
        "dates": "Jun 2013 – Mar 2021",
        "tech": "JavaScript/TypeScript, TestCafe, Node/npm, Git, Jira, WCAG",
        "bullets": [
            "Delivered automation and accessibility testing for startup clients; strengthened regression coverage.",
            "Created reusable test tooling and cross-browser checklists to support WCAG-aligned releases.",
        ],
    },
]

PROJECTS = [
    {
        "name": "destamatic-ui",
        "url": "https://torrin.me/destamatic-ui",
        "desc": "Lightweight UI framework using fine-grained observers with routing, SSG/SEO, theming, icons, and rich text.",
        "bullets": [
            "Used for Equator mapping/AI platform, torrin.me, and OpenGig.org.",
            "Improves performance and predictability vs heavier component stacks.",
        ],
    },
    {
        "name": "OpenGig.org",
        "url": "https://opengig.org",
        "desc": "Open-source platform for gig workers and customers.",
        "bullets": [
            "Built a full-stack app in JavaScript with a custom UI framework, database state-sync, and WebSocket layer.",
            "Deployed to a DigitalOcean droplet behind NGINX, with GitHub Actions for CI.",
        ],
    },
    {
        "name": "Blend_My_NFTs",
        "url": "https://github.com/torrinworx/Blend_My_NFTs",
        "desc": "Blender add-on for generating 3D NFT collections.",
        "bullets": [
            "Reached ~1k GitHub stars, 200K+ YouTube views, and is used by multiple studios and NFT projects.",
            "Automates 3D asset generation and export pipelines from Blender.",
        ],
    },
    {
        "name": "MangoSync",
        "url": "https://github.com/torrinworx/MangoSync",
        "desc": "Local music player with AI-assisted lyrics and metadata.",
        "bullets": [
            "Uses Whisper to auto-generate and align lyrics for time-synced playback.",
            "Displays time-synced lyrics in an Apple-style karaoke mode lyric scroller.",
            "Enhances albums with additional metadata like artwork and descriptions.",
        ],
    },
]

SKILLS = [
    ("Languages", "JavaScript, TypeScript, Python"),
    ("Frontend", "React, destamatic-ui, HTML/CSS"),
    ("Backend", "Node.js, Express, FastAPI, Django"),
    ("Databases", "MongoDB, Qdrant, ChromaDB"),
    (
        "Cloud & DevOps",
        "Docker, GitLab CI/CD, GitHub Actions, DigitalOcean, AWS, Proxmox, Linux (Ubuntu/Arch)",
    ),
    ("AI & Data", "OpenAI API (embeddings + fine-tuning), GeoPandas, pandas"),
    ("Accessibility", "WCAG audits, W3C Web Accessibility (WAI0.1x)"),
    ("Testing", "TestCafe, automation testing"),
]


# ---------- HEADER WITH BUTTONS ---------- #


def draw_header_with_buttons(c):
    width, height = LETTER

    # Name
    c.setFont("Helvetica-Bold", 17)
    c.drawString(72, height - 62, NAME)

    # Title
    c.setFont("Helvetica", 10)
    c.drawString(72, height - 80, TITLE)

    # Location + years
    c.setFont("Helvetica", 8.5)
    c.drawString(72, height - 108, f"{LOCATION} · {YEARS_EXP}")

    # Email
    c.drawString(72, height - 122, f"Email: {EMAIL}")

    # Buttons
    button_y = height - 146
    button_height = 16
    padding_x = 8
    gap = 8

    links = [
        ("Website", WEBSITE),
        ("GitHub", GITHUB),
        ("LinkedIn", LINKEDIN),
    ]

    x = 72
    for label, url in links:
        c.setFont("Helvetica-Bold", 8.5)
        text_width = c.stringWidth(label, "Helvetica-Bold", 8.5)
        button_width = text_width + padding_x * 2

        # Button background
        c.setFillColor(colors.lightgrey)
        c.roundRect(x, button_y, button_width, button_height, 4, fill=1, stroke=0)

        # Text
        c.setFillColor(colors.black)
        c.drawString(x + padding_x, button_y + 5, label)

        # Clickable link
        c.linkURL(url, (x, button_y, x + button_width, button_y + button_height))

        x += button_width + gap

    c.setFillColor(colors.black)


# ---------- STORY (MAIN CONTENT) ---------- #


def build_story():
    styles = getSampleStyleSheet()

    h1 = ParagraphStyle(
        "Heading1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=11,
        spaceBefore=8,
        spaceAfter=4,
    )

    h2 = ParagraphStyle(
        "Heading2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        spaceBefore=6,
        spaceAfter=3,
    )

    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
    )

    italic = ParagraphStyle(
        "Italic",
        parent=body,
        fontName="Helvetica-Oblique",
    )

    story = []

    # Space under header
    story.append(Spacer(1, 100))

    # Summary
    story.append(Paragraph("Summary", h1))
    story.append(Paragraph(SUMMARY.strip().replace("\n", " "), body))

    # Positions
    story.append(Spacer(1, 6))
    story.append(Paragraph("Experience", h1))

    for job in POSITIONS:
        title_line = f"<b>{job['role']} — {job['company']}</b>"
        story.append(Paragraph(title_line, body))
        story.append(Paragraph(f"{job['dates']} | {job['location']}", italic))
        if job.get("tech"):
            story.append(Paragraph(f"<b>Tech: {job['tech']}</b>", body))

        bullets = [Paragraph(b, body) for b in job["bullets"]]
        story.append(ListFlowable(bullets, bulletType="bullet", bulletFontSize=5.5, leftIndent=10))
        story.append(Spacer(1, 4))

    # Projects
    story.append(Spacer(1, 4))
    story.append(Paragraph("Projects", h1))

    for proj in PROJECTS:
        name_line = f"<b>{proj['name']}</b> — <font color='blue'>{proj['url']}</font>"
        story.append(Paragraph(name_line, body))
        story.append(Paragraph(proj["desc"], italic))

        bullets = [Paragraph(b, body) for b in proj["bullets"]]
        story.append(ListFlowable(bullets, bulletType="bullet", bulletFontSize=5.5, leftIndent=10))
        story.append(Spacer(1, 4))

    # Skills
    story.append(Spacer(1, 4))
    story.append(Paragraph("Skills", h1))

    for label, text in SKILLS:
        line = f"<b>{label}:</b> {text}"
        story.append(Paragraph(line, body))

    return story


# ---------- BUILD PDF ---------- #


def create_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=LETTER,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    story = build_story()

    def on_first_page(canv, doc_obj):
        draw_header_with_buttons(canv)

    def on_later_pages(canv, doc_obj):
        # simple header on later pages
        canv.setFont("Helvetica-Bold", 9)
        canv.drawString(72, LETTER[1] - 50, f"{NAME} – {TITLE}")
        canv.setFont("Helvetica", 8)
        canv.drawRightString(LETTER[0] - 72, LETTER[1] - 50, WEBSITE)

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)


if __name__ == "__main__":
    create_pdf(OUTPUT_FILE)
    print(f"Created {OUTPUT_FILE}")
