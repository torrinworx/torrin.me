"""Render the resume PDF from the single source of truth.

Content is NOT defined in this file. It lives in frontend/data/resume.json, which the
website (frontend/pages/Landing.jsx) also imports. This script only decides how that
data is laid out on paper. Editing content here would recreate the drift this file was
refactored to remove, so change the JSON instead.

Run via `npm run resume:pdf`, or automatically as the first step of build.sh.
"""

import json
from datetime import date
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    ListFlowable,
)

REPO_ROOT = Path(__file__).resolve().parent
DATA_FILE = REPO_ROOT / "frontend" / "data" / "resume.json"

# Write straight into the served asset directory. The site's download button fetches
# /Torrin_Leonard_Resume.pdf from frontend/public, so generating anywhere else leaves
# the live download stale.
OUTPUT_FILE = REPO_ROOT / "frontend" / "public" / "Torrin_Leonard_Resume.pdf"

RESUME = json.loads(DATA_FILE.read_text(encoding="utf-8"))
PROFILE = RESUME["profile"]

NAME = PROFILE["name"]
TITLE = PROFILE["title"]
EMAIL = PROFILE["email"]
WEBSITE = PROFILE["website"]
GITHUB = PROFILE["github"]
LINKEDIN = PROFILE["linkedin"]

# Applicant tracking systems read the PDF text layer, not the clickable link
# annotations. The header buttons below are drawn on the canvas, so their text layer
# contains only the words "Website", "GitHub" and "LinkedIn"; the URLs themselves are
# invisible to a parser. This line puts the real contact details into the flowed text
# so they are extractable and so regex-based LinkedIn/phone fields populate.
CONTACT_LINE = " | ".join(
    [
        PROFILE["location"],
        EMAIL,
        PROFILE["phone"],
        WEBSITE.replace("https://", ""),
        LINKEDIN.replace("https://www.", "").rstrip("/"),
        GITHUB.replace("https://", ""),
    ]
)

# Location is one of the most common hard knockout filters. Stating the remote
# constraint in extractable text lets a screener resolve it without guessing.
REMOTE_LINE = PROFILE["remote"]


def format_month(iso_date):
    """2023-03-01 -> 'Mar 2023'."""
    parsed = date.fromisoformat(iso_date)
    return parsed.strftime("%b %Y")


def format_range(start, end):
    """A plain hyphen, not an en dash: ATS text extraction handles it more predictably."""
    return f"{format_month(start)} - {format_month(end) if end else 'Present'}"


def for_pdf(entries):
    """The website has unlimited room, the PDF has to hold at two pages. Entries opting
    out with "pdf": false stay on the site and are dropped here. See _pdfFlag in the JSON."""
    return [entry for entry in entries if entry.get("pdf", True)]


# ---------- HEADER WITH BUTTONS ---------- #


def draw_header_with_buttons(c):
    width, height = LETTER

    # Name
    c.setFont("Helvetica-Bold", 17)
    c.drawString(72, height - 62, NAME)

    # Title
    c.setFont("Helvetica", 10)
    c.drawString(72, height - 80, TITLE)

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

    # Section spacing is deliberately tight. The content is sized to land on exactly two
    # pages; loosening these pushes the tail of Skills onto a third, mostly empty page.
    h1 = ParagraphStyle(
        "Heading1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=11,
        spaceBefore=6,
        spaceAfter=3,
    )

    # 8.5/10.5 is a 1.24 line-height ratio, comfortable for print and tighter than the
    # previous 8.5/11. The half point back per line is what buys the Education section
    # without cutting content, and leaves headroom for a few future additions.
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=10.5,
    )

    italic = ParagraphStyle(
        "Italic",
        parent=body,
        fontName="Helvetica-Oblique",
    )

    contact = ParagraphStyle(
        "Contact",
        parent=body,
        fontSize=8,
        leading=10,
        spaceAfter=2,
    )

    story = []

    # Space under header
    story.append(Spacer(1, 100))

    # Parser-readable contact details. See CONTACT_LINE above for why this is flowed
    # text rather than part of the drawn header.
    story.append(Paragraph(CONTACT_LINE, contact))
    story.append(Paragraph(f"<b>{REMOTE_LINE}</b>", contact))

    # Summary
    story.append(Paragraph("Summary", h1))
    story.append(Paragraph(PROFILE["summary"], body))

    # Positions
    story.append(Spacer(1, 3))
    story.append(Paragraph("Experience", h1))

    for job in for_pdf(RESUME["work"]):
        title_line = f"<b>{job['role']}, {job['company']}</b>"
        story.append(Paragraph(title_line, body))
        dates = format_range(job["start"], job.get("end"))
        story.append(Paragraph(f"{dates} | {job['location']}", italic))
        if job.get("tech"):
            story.append(Paragraph(f"<b>Tech: {job['tech']}</b>", body))

        bullets = [Paragraph(b, body) for b in job["bullets"]]
        story.append(ListFlowable(bullets, bulletType="bullet", bulletFontSize=5.5, leftIndent=10))
        story.append(Spacer(1, 3))

    # Projects
    story.append(Spacer(1, 2))
    story.append(Paragraph("Projects", h1))

    for proj in for_pdf(RESUME["projects"]):
        name_line = f"<b>{proj['name']}</b> | <font color='blue'>{proj['url']}</font>"
        story.append(Paragraph(name_line, body))
        story.append(Paragraph(proj["description"], italic))

        bullets = [Paragraph(b, body) for b in proj["bullets"]]
        story.append(ListFlowable(bullets, bulletType="bullet", bulletFontSize=5.5, leftIndent=10))
        story.append(Spacer(1, 3))

    # Skills
    story.append(Spacer(1, 2))
    story.append(Paragraph("Skills", h1))

    for skill in RESUME["skills"]:
        story.append(Paragraph(f"<b>{skill['label']}:</b> {skill['text']}", body))

    # Education. Kept to one line: a self-taught candidate needs the heading present so
    # form parsers find an education field, and needs the on-domain credentials in
    # extractable text, but a list of MOOCs reads as padding.
    education = RESUME.get("education")
    if education:
        story.append(Spacer(1, 2))
        story.append(Paragraph("Education", h1))
        credentials = ", ".join(
            f"{c['name']} ({c['issuer']}, {c['year']})"
            for c in for_pdf(education.get("credentials", []))
        )
        line = education["summary"]
        if credentials:
            line = f"{line} {credentials}."
        story.append(Paragraph(line, body))

    return story


# ---------- BUILD PDF ---------- #


def create_pdf(filename):
    doc = SimpleDocTemplate(
        str(filename),
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
        canv.drawString(72, LETTER[1] - 50, f"{NAME}, {TITLE}")
        canv.setFont("Helvetica", 8)
        canv.drawRightString(LETTER[0] - 72, LETTER[1] - 50, WEBSITE)

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)


if __name__ == "__main__":
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    create_pdf(OUTPUT_FILE)
    print(f"Created {OUTPUT_FILE.relative_to(REPO_ROOT)} from {DATA_FILE.relative_to(REPO_ROOT)}")
