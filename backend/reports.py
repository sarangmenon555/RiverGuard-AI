"""
Generates a downloadable one-page PDF report for a district's current
flood risk status, for printing or sharing with local officials.
"""

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

NAVY = colors.HexColor("#0f1e3a")
AQUA = colors.HexColor("#14b8a6")
RISK_COLORS = {
    "Low": colors.HexColor("#0d9488"),
    "Medium": colors.HexColor("#b45309"),
    "High": colors.HexColor("#b91c1c"),
}


def generate_district_report_pdf(district: dict, prediction: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleStyle", parent=styles["Title"], textColor=NAVY, fontSize=22
    )
    heading_style = ParagraphStyle(
        "HeadingStyle", parent=styles["Heading2"], textColor=NAVY, spaceBefore=14
    )
    body_style = ParagraphStyle("BodyStyle", parent=styles["Normal"], fontSize=10.5, leading=15)
    small_style = ParagraphStyle("SmallStyle", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    risk = prediction["risk_class"]
    risk_color = RISK_COLORS.get(risk, colors.black)

    elements = []
    elements.append(Paragraph("RiverGuard AI", title_style))
    elements.append(Paragraph("Flood Risk Report for Keralam", body_style))
    elements.append(Spacer(1, 10 * mm))

    elements.append(Paragraph(f"{district['name']} District", heading_style))
    elements.append(Paragraph(district.get("risk_factor", ""), body_style))
    elements.append(Spacer(1, 4 * mm))

    risk_style = ParagraphStyle(
        "RiskStyle", parent=styles["Heading1"], textColor=risk_color, fontSize=18
    )
    elements.append(Paragraph(f"Current Risk Level: {risk}", risk_style))
    elements.append(
        Paragraph(f"Model confidence: {prediction['confidence'] * 100:.0f}%", small_style)
    )
    elements.append(Spacer(1, 6 * mm))

    raw = prediction["raw_features"]
    data_rows = [
        ["Indicator", "Value"],
        ["Rainfall (last 24 hours)", f"{raw['rain_24h']:.1f} mm"],
        ["Rainfall (last 72 hours)", f"{raw['rain_72h']:.1f} mm"],
        ["River level (estimated)", f"{raw['river_level_ratio'] * 100:.0f}% of bank-full"],
        ["Soil saturation", f"{raw['soil_saturation'] * 100:.0f}%"],
    ]
    if "reservoir_pct" in raw and raw["reservoir_pct"] is not None:
        is_live = raw.get("reservoir_pct_is_live", False)
        label = "Nearest reservoir storage (live)" if is_live else "Nearest reservoir storage (estimated)"
        data_rows.append([label, f"{raw['reservoir_pct']:.1f}% of capacity"])

    table = Table(data_rows, colWidths=[90 * mm, 60 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph("Recommended Actions", heading_style))
    for action in prediction["recommended_actions"]:
        elements.append(Paragraph(f"&bull; {action}", body_style))

    elements.append(Spacer(1, 10 * mm))
    generated = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
    elements.append(Paragraph(f"Report generated: {generated}", small_style))
    elements.append(Spacer(1, 4 * mm))
    elements.append(
        Paragraph(
            "Risk predictions are generated from a machine learning model trained on "
            "physics-informed synthetic data modelled after historical flood patterns. "
            "This platform is a decision-support tool and does not replace official "
            "warnings issued by the Kerala State Disaster Management Authority.",
            small_style,
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
