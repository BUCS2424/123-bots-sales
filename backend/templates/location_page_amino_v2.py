from html import escape
import json
import re


STATE_ABBR_MAP = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new-hampshire": "NH", "new-jersey": "NJ",
    "new-mexico": "NM", "new-york": "NY", "north-carolina": "NC", "north-dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode-island": "RI", "south-carolina": "SC",
    "south-dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west-virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
}


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"\s+", "-", value)
    return value.strip("-")


def generate_location_page_html(
    location_name: str,
    location_type: str,
    state_name: str,
    state_slug: str,
    county_count: int = 0,
    city_count: int = 0,
    counties: list | None = None,
    cities: list | None = None,
    base_url: str = "https://gingerkare.com",
) -> str:
    counties = counties or []
    cities = cities or []

    safe_location_name = escape(location_name)
    safe_state_name = escape(state_name)
    state_abbr = STATE_ABBR_MAP.get(state_slug, state_slug[:2].upper())

    if location_type == "state":
        location_slug = state_slug
        location_label = safe_location_name
        type_label = "State"
        title = f"Peptide Research Supply in {safe_location_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN provides precision synthesized peptides for non-human research in {safe_location_name}. "
            f"Coverage includes {county_count} counties and {city_count} cities."
        )
    elif location_type == "county":
        location_slug = f"{_slugify(location_name.replace(' County', ''))}-{state_abbr.lower()}"
        location_label = f"{safe_location_name}, {safe_state_name}"
        type_label = "County"
        title = f"Peptide Research Supply in {safe_location_name}, {safe_state_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research in {safe_location_name}, {safe_state_name}."
        )
    else:
        location_slug = f"{_slugify(location_name)}-{state_abbr.lower()}"
        location_label = f"{safe_location_name}, {state_abbr}"
        type_label = "City"
        title = f"Peptide Research Supply in {safe_location_name}, {state_abbr} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research workflows in {safe_location_name}, {safe_state_name}."
        )

    canonical_path = f"/locations/peptide-research-supply-{location_slug}"
    canonical_url = f"{base_url}{canonical_path}"
    keywords = (
        f"AMINO-CHAIN peptides, {location_name} peptide research supply, "
        f"non-human research peptides, {state_name} peptide catalog"
    )

    json_ld_payload = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": canonical_url,
        "inLanguage": "en-US",
        "publisher": {
            "@type": "Organization",
            "name": "AMINO-CHAIN",
            "url": base_url,
        },
        "about": [
            "Research peptides",
            "Laboratory non-human use",
            location_label,
        ],
    }

    county_links = "".join(
        [
            (
                f'<a class="chip" href="/locations/peptide-research-supply-{_slugify(county.replace(" County", ""))}-{state_abbr.lower()}">'
                f'{escape(county)}</a>'
            )
            for county in counties[:30]
        ]
    )
    city_links = "".join(
        [
            (
                f'<a class="chip" href="/locations/peptide-research-supply-{_slugify(city)}-{state_abbr.lower()}">'
                f'{escape(city)}</a>'
            )
            for city in cities[:60]
        ]
    )

    crumbs = (
        f'<a href="/locations/peptide-research-supply-{state_slug}">{safe_state_name}</a> <span>→</span> <strong>{safe_location_name}</strong>'
        if location_type != "state"
        else f'<strong>{safe_location_name}</strong>'
    )

    return f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description)}" />
  <meta name="keywords" content="{escape(keywords)}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{canonical_url}" />
  <meta property="og:site_name" content="AMINO-CHAIN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape(title)}" />
  <meta name="twitter:description" content="{escape(description)}" />
  <link rel="canonical" href="{canonical_url}" />
  <script type="application/ld+json">{json.dumps(json_ld_payload)}</script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />

  <style>
    :root {{
      --bg-main: #f8f2ff;
      --purple: #6e2ea8;
      --gold: #d8a85d;
      --gold-soft: #fff0d8;
      --ink: #231638;
      --muted: #6e6382;
      --card-border: #eadcf8;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: 'Manrope', system-ui, sans-serif; color: var(--ink); background: var(--bg-main); }}
    .hero-wrap {{ background: radial-gradient(circle at 12% 18%, rgba(216,168,93,.35), transparent 28%), radial-gradient(circle at 88% 16%, rgba(110,46,168,.45), transparent 33%), linear-gradient(130deg, #22093f 0%, #4b1d77 48%, #7f35bf 100%); color: #f8f0ff; padding: 18px 0 28px; }}
    .container {{ width: min(1320px, 95vw); margin: 0 auto; }}
    .topbar {{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; }}
    .brand {{ display:inline-flex; align-items:center; gap:10px; color:#fff; text-decoration:none; font-family:'Space Grotesk',sans-serif; font-weight:700; }}
    .brand-chip {{ width:38px; height:38px; border-radius:10px; background: linear-gradient(135deg, var(--gold), #c28f3f); color:#35185d; display:inline-flex; align-items:center; justify-content:center; font-weight:800; }}
    .nav-links {{ display:flex; gap:8px; flex-wrap:wrap; }}
    .nav-links a {{ color:#f6e9ff; text-decoration:none; border:1px solid rgba(255,255,255,.24); border-radius:999px; padding:8px 12px; font-size:13px; }}

    .hero {{ margin-top:14px; border:1px solid rgba(255,255,255,.2); border-radius:26px; padding:28px; background:rgba(255,255,255,.08); }}
    .eyebrow {{ display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(255,255,255,.24); border-radius:999px; padding:8px 12px; text-transform:uppercase; font-size:12px; letter-spacing:.08em; font-weight:700; }}
    .eyebrow-dot {{ width:8px; height:8px; border-radius:50%; background:var(--gold); }}
    h1 {{ margin:12px 0 10px; font-family:'Space Grotesk',sans-serif; font-size:clamp(2.1rem, 5vw, 3.7rem); line-height:1.04; letter-spacing:-.03em; max-width:1000px; }}
    .hero p {{ margin:0; color:#ebddff; max-width:980px; line-height:1.7; }}
    .crumbs {{ margin-top:10px; font-size:13px; color:#d8c1f4; }}
    .crumbs a {{ color:#f7ebff; }}
    .cta-row {{ display:flex; gap:12px; flex-wrap:wrap; margin-top:18px; }}
    .btn {{ text-decoration:none; border-radius:999px; padding:11px 16px; font-weight:700; font-size:14px; display:inline-flex; align-items:center; justify-content:center; }}
    .btn-primary {{ background:linear-gradient(135deg,var(--gold), #c79140); color:#34175a; box-shadow:0 8px 22px rgba(216,168,93,.35); }}
    .btn-secondary {{ color:#fff; border:1px solid rgba(255,255,255,.34); background:rgba(255,255,255,.12); }}

    .metrics {{ margin-top:16px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }}
    .metric {{ border:1px solid rgba(255,255,255,.22); border-radius:14px; padding:12px; background:rgba(255,255,255,.08); }}
    .metric strong {{ display:block; color:#fff8ea; font-size:1.25rem; }}
    .metric span {{ color:#e5d6f8; font-size:12px; }}

    .section {{ margin-top:18px; background:#fff; border:1px solid var(--card-border); border-radius:22px; padding:22px; box-shadow:0 8px 20px rgba(74,38,117,.08); }}
    .section h2 {{ margin:0 0 10px; font-size:1.45rem; font-family:'Space Grotesk',sans-serif; color:#2f1850; }}
    .section p {{ margin:0; color:var(--muted); line-height:1.7; }}
    .info-grid {{ margin-top:14px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }}
    .info-card {{ border:1px solid #eadcf8; border-radius:16px; padding:15px; background:linear-gradient(180deg,#fff,#fcf8ff); }}
    .info-card h3 {{ margin:0 0 7px; font-size:1.05rem; color:#311c53; }}
    .info-card p {{ margin:0; font-size:14px; color:#5f5475; line-height:1.65; }}

    .coverage-grid {{ margin-top:14px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }}
    .chip-box {{ border:1px solid #eadcf8; border-radius:16px; padding:14px; background:#fff; }}
    .chip-box h3 {{ margin:0 0 10px; font-size:1rem; color:#2f1850; }}
    .chip-row {{ display:flex; flex-wrap:wrap; gap:8px; }}
    .chip {{ text-decoration:none; border:1px solid #e6d5f8; border-radius:999px; padding:7px 10px; font-size:12px; color:#492a74; background:#fff; }}
    .chip:hover {{ border-color:#d8a85d; color:#724408; background:#fff8ec; }}

    .testimonials {{ margin-top:18px; background:linear-gradient(135deg,#2a0b45 0%, #5f249d 60%, #8b49c4 100%); border-radius:22px; padding:22px; color:#fff; }}
    .testimonials h2 {{ margin:0 0 12px; font-family:'Space Grotesk',sans-serif; }}
    .testimonial-grid {{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }}
    .quote {{ border:1px solid rgba(255,255,255,.24); border-radius:16px; padding:14px; background:rgba(255,255,255,.11); }}
    .quote p {{ margin:0; color:#f3e7ff; font-size:14px; line-height:1.6; }}
    .quote cite {{ display:block; margin-top:8px; font-size:12px; color:#f7dcac; font-style:normal; }}

    .compliance {{ margin-top:12px; padding:14px; border:1px solid #f1d8ac; border-radius:14px; background:var(--gold-soft); color:#634710; font-size:13px; line-height:1.55; }}
    .footer {{ margin:16px 0 4px; text-align:center; color:#7f7493; font-size:12px; }}

    @media (max-width: 1100px) {{
      .info-grid, .testimonial-grid {{ grid-template-columns:repeat(2,minmax(0,1fr)); }}
      .metrics {{ grid-template-columns:repeat(2,minmax(0,1fr)); }}
    }}
    @media (max-width: 760px) {{
      .hero {{ padding:20px; }}
      .container {{ width:min(1320px, 96vw); }}
      .coverage-grid, .info-grid, .testimonial-grid {{ grid-template-columns:1fr; }}
      .metrics {{ grid-template-columns:1fr 1fr; }}
      .section, .testimonials {{ padding:16px; border-radius:16px; }}
    }}
  </style>
</head>
<body>
  <div class="hero-wrap">
    <div class="container">
      <header class="topbar">
        <a class="brand" href="/"><span class="brand-chip">A</span><span>AMINO-CHAIN</span></a>
        <nav class="nav-links">
          <a href="/premium-peptides">Peptides Catalog</a>
          <a href="/peptides-research">Research Library</a>
        </nav>
      </header>

      <section class="hero">
        <span class="eyebrow"><span class="eyebrow-dot"></span>{type_label} Coverage • AMINO-CHAIN</span>
        <h1>Precision Synthesized Peptides for Research Teams in {location_label}</h1>
        <p>{escape(description)}</p>
        <div class="crumbs">{crumbs}</div>
        <div class="cta-row">
          <a class="btn btn-primary" href="/premium-peptides">Explore Peptides</a>
          <a class="btn btn-secondary" href="/peptides-research">Open Research Library</a>
        </div>
        <div class="metrics">
          <div class="metric"><strong>{county_count}</strong><span>Counties Covered</span></div>
          <div class="metric"><strong>{city_count}</strong><span>Cities Covered</span></div>
          <div class="metric"><strong>99%+</strong><span>Purity Benchmark</span></div>
          <div class="metric"><strong>Single / Half / Full</strong><span>Vial Options</span></div>
        </div>
      </section>
    </div>
  </div>

  <div class="container">
    <section class="section">
      <h2>Peptide Research Information</h2>
      <p>Our location pages are built for scientific teams to quickly map supply coverage while connecting to the AMINO-CHAIN catalog and research library.</p>
      <div class="info-grid">
        <article class="info-card">
          <h3>Healing & Recovery Peptides</h3>
          <p>BPC-157, TB-500, and related compounds are indexed for non-human research workflows focused on tissue signaling and recovery pathway exploration.</p>
        </article>
        <article class="info-card">
          <h3>Cognitive & Neuro Compounds</h3>
          <p>Semax, Selank, and amidated variants are listed with research context for neuro-signaling, learning pathway, and behavioral model studies.</p>
        </article>
        <article class="info-card">
          <h3>Metabolic Research Catalog</h3>
          <p>Semaglutide, Tirzepatide, Retatrutide, and related compounds are available with configurable strength and kit options for laboratory analysis.</p>
        </article>
      </div>
    </section>

    <section class="section">
      <h2>Coverage by Region</h2>
      <p>Use county and city pages to navigate local coverage while preserving the same AMINO-CHAIN research-first structure.</p>
      <div class="coverage-grid">
        {f'<article class="chip-box"><h3>County Coverage</h3><div class="chip-row">{county_links}</div></article>' if county_links else '<article class="chip-box"><h3>County Coverage</h3><p>No county list available for this location type.</p></article>'}
        {f'<article class="chip-box"><h3>City Coverage</h3><div class="chip-row">{city_links}</div></article>' if city_links else '<article class="chip-box"><h3>City Coverage</h3><p>No city list available for this location type.</p></article>'}
      </div>
      <div class="compliance"><strong>Compliance Notice:</strong> Products and related information are intended for non-human research use only and are not for human consumption.</div>
    </section>

    <section class="testimonials">
      <h2>What Research Teams Say</h2>
      <div class="testimonial-grid">
        <article class="quote">
          <p>“The catalog structure is clean, and the location coverage helped our team map procurement workflow faster than expected.”</p>
          <cite>— Research Operations Lead, FL</cite>
        </article>
        <article class="quote">
          <p>“Having peptide options and research references linked in one flow reduced time between planning and bench validation.”</p>
          <cite>— Biomedical Lab Manager, TX</cite>
        </article>
        <article class="quote">
          <p>“Strong visual presentation and clear compliance messaging made this easy to share across internal lab teams.”</p>
          <cite>— Principal Investigator, CA</cite>
        </article>
      </div>
    </section>

    <footer class="footer">© 2026 AMINO-CHAIN Peptides • Location index: {escape(location_slug)}</footer>
  </div>
</body>
</html>
"""
