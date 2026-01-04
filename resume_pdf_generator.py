from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    ListFlowable,
    ListItem,
)
from reportlab.lib.units import inch

OUTPUT_FILE = "Torrin_Leonard_Resume.pdf"

NAME = "Torrin Leonard"
TITLE = "Full-Stack Software Engineer"

LOCATION = "Waterloo, Ontario, Canada"
YEARS_EXP = "9 years professional experience"
EMAIL = "torrin@torrin.me"
WEBSITE = "https://torrin.me"
GITHUB = "https://github.com/torrinworx"
LINKEDIN = "https://www.linkedin.com/in/torrin-leonard-8343a1154/"

# --- CONTENT (kept close to your Landing.jsx) --- #

SUMMARY = """
Full-stack software engineer with 9 years of professional experience across startups,
contract work, and open-source projects. I build AI-powered web apps, custom UI frameworks,
and the infrastructure they run on, with a focus on accessibility, performance, and clean UX.
"""

POSITIONS = [
    {
        "role": "Full Stack Software Developer",
        "company": "Equator",
        "location": "Hybrid / Waterloo, ON",
        "dates": "Mar 2023 – Present",
        "bullets": [
            "Built and shipped an AI-driven proposal tool (backend + frontend).",
            "Created an accessible UI component library used across GIS and AI products.",
        ],
    },
    {
        "role": "Co-Founder, CEO, Lead Software Developer",
        "company": "This Cozy Studio Inc.",
        "location": "Waterloo, ON",
        "dates": "Oct 2021 – Jan 2025",
        "bullets": [
            "Created Blend_My_NFTs, a Blender add-on with ~1k GitHub stars.",
            "Designed and maintained tools for 3D project pipelines.",
        ],
    },
    {
        "role": "Automation and Accessibility QA",
        "company": "League",
        "location": "Remote",
        "dates": "Mar 2021 – May 2022",
        "bullets": [
            "Wrote TestCafe automation for regression testing.",
            "Performed accessibility audits against WCAG guidelines.",
        ],
    },
    {
        "role": "Automation and Accessibility QA",
        "company": "worX4you Inc.",
        "location": "Contract / Various Clients",
        "dates": "Jun 2013 – Jun 2025",
        "bullets": [
            "Provided QA and automation for multiple startup clients.",
            "Focused on cross-browser testing and accessibility issues.",
        ],
    },
]

PROJECTS = [
    {
        "name": "destamatic-ui",
        "url": "https://torrin.me/destamatic-ui",
        "desc": "A batteries-included frontend framework built on fine-grained Observers.",
        "bullets": [
            "No React, no VDOM. Components, routing, SSG/SEO, theming, icons, and rich text in one stack.",
            "Used for Equator Studios mapping/AI platform, torrin.me, and OpenGig.org.",
            "Replaces heavier React + MUI stacks with a smaller, fast, and predictable component system.",
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
        "name": "MangoSync",
        "url": "https://github.com/torrinworx/MangoSync",
        "desc": "Local music player with AI-assisted lyrics and metadata.",
        "bullets": [
            "Uses Whisper to auto-generate and align lyrics for time-synced playback.",
            "Displays time-synced lyrics in an Apple-style karaoke mode lyric scroller.",
            "Enhances albums with additional metadata like artwork and descriptions.",
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
]

SKILLS = [
    ("Programming Languages", "JavaScript, TypeScript, Python"),
    (
        "Frontend & UI",
        "React, destamatic-ui, Three.js/WebGL, responsive and accessible (WCAG)",
    ),
    ("Backend & APIs", "Node.js, Express, FastAPI, REST, WebSockets"),
    ("Databases", "MongoDB, MariaDB, Redis"),
    (
        "Cloud & DevOps",
        "Linux (Ubuntu/Arch), Docker, NGINX, DigitalOcean, AWS, GitHub Actions, GitLab CI/CD",
    ),
    (
        "Testing & Quality",
        "TestCafe, automated regression testing, accessibility audits",
    ),
    ("AI & ML", "OpenAI API, Whisper, Hugging Face, Qdrant, LangChain, vector search"),
    (
        "Certifications",
        "Harvard CS50 (Intro to Computer Science), W3C Web Accessibility (WAI0.1x)",
    ),
]


# ---------- HEADER WITH BUTTONS ---------- #


def draw_header_with_buttons(c):
    width, height = LETTER

    # Name
    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, height - 72, NAME)

    # Title
    c.setFont("Helvetica", 11)
    c.drawString(72, height - 92, TITLE)

    # Location + years
    c.setFont("Helvetica", 9)
    c.drawString(72, height - 126, f"{LOCATION} · {YEARS_EXP}")

    # Email
    c.drawString(72, height - 140, f"Email: {EMAIL}")

    # Buttons
    button_y = height - 170
    button_height = 18
    padding_x = 8
    gap = 8

    links = [
        ("Website", WEBSITE),
        ("GitHub", GITHUB),
        ("LinkedIn", LINKEDIN),
    ]

    x = 72
    for label, url in links:
        c.setFont("Helvetica-Bold", 9)
        text_width = c.stringWidth(label, "Helvetica-Bold", 9)
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
        fontSize=12,
        spaceBefore=12,
        spaceAfter=6,
    )

    h2 = ParagraphStyle(
        "Heading2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        spaceBefore=8,
        spaceAfter=4,
    )

    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
    )

    italic = ParagraphStyle(
        "Italic",
        parent=body,
        fontName="Helvetica-Oblique",
    )

    story = []

    # Space under header
    story.append(Spacer(1, 90))

    # Summary
    story.append(Paragraph("Summary", h1))
    story.append(Paragraph(SUMMARY.strip().replace("\n", " "), body))

    # Positions
    story.append(Spacer(1, 6))
    story.append(Paragraph("Positions", h1))

    for job in POSITIONS:
        title_line = f"<b>{job['role']} — {job['company']}</b>"
        story.append(Paragraph(title_line, body))
        story.append(Paragraph(f"{job['dates']} | {job['location']}", italic))

        bullets = [ListItem(Paragraph(b, body), leftIndent=4) for b in job["bullets"]]
        story.append(ListFlowable(bullets, bulletType="bullet", bulletFontSize=6))
        story.append(Spacer(1, 4))

    # Projects
    story.append(Spacer(1, 4))
    story.append(Paragraph("Projects", h1))

    for proj in PROJECTS:
        name_line = f"<b>{proj['name']}</b> — <font color='blue'>{proj['url']}</font>"
        story.append(Paragraph(name_line, body))
        story.append(Paragraph(proj["desc"], italic))

        bullets = [ListItem(Paragraph(b, body), leftIndent=4) for b in proj["bullets"]]
        story.append(ListFlowable(bullets, bulletType="bullet", bulletFontSize=6))
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
        leftMargin=72,
        rightMargin=72,
        topMargin=72,
        bottomMargin=72,
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
