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
        region_label = safe_location_name
        type_label = "State Coverage"
        title = f"Peptide Research Supply in {safe_location_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research in {safe_location_name}. "
            f"Coverage includes {county_count} counties and {city_count} cities with catalog and research access."
        )
    elif location_type == "county":
        location_slug = f"{_slugify(location_name.replace(' County', ''))}-{state_abbr.lower()}"
        region_label = f"{safe_location_name}, {safe_state_name}"
        type_label = "County Coverage"
        title = f"Peptide Research Supply in {safe_location_name}, {safe_state_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research operations in {safe_location_name}, {safe_state_name}."
        )
    else:
        location_slug = f"{_slugify(location_name)}-{state_abbr.lower()}"
        region_label = f"{safe_location_name}, {state_abbr}"
        type_label = "City Coverage"
        title = f"Peptide Research Supply in {safe_location_name}, {state_abbr} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research teams in {safe_location_name}, {safe_state_name}."
        )

    canonical_path = f"/locations/peptide-research-supply-{location_slug}"
    canonical_url = f"{base_url}{canonical_path}"
    keywords = (
        f"AMINO-CHAIN peptides, {location_name} peptide research supply, "
        f"non-human research peptides, {state_name} peptide catalog, research peptide provider"
    )

    json_ld_payload = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": canonical_url,
        "inLanguage": "en-US",
        "about": ["Research peptides", "Non-human laboratory use", region_label],
        "publisher": {
            "@type": "Organization",
            "name": "AMINO-CHAIN",
            "url": "/",
        },
    }

    county_links = "".join(
        [
            (
                f'<a href="/locations/peptide-research-supply-{_slugify(county.replace(" County", ""))}-{state_abbr.lower()}" '
                f'class="chip" title="{escape(county)}">{escape(county)}</a>'
            )
            for county in counties[:30]
        ]
    )

    city_links = "".join(
        [
            (
                f'<a href="/locations/peptide-research-supply-{_slugify(city)}-{state_abbr.lower()}" '
                f'class="chip" title="{escape(city)}">{escape(city)}</a>'
            )
            for city in cities[:60]
        ]
    )

    breadcrumbs = (
        f'<a href="/locations/peptide-research-supply-{state_slug}">{safe_state_name}</a>'
        if location_type != "state"
        else ""
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
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />

  <style>
    :root {{
      --text-dark: #1f1433;
      --text-light: #f8f1ff;
      --muted: #6d6382;
      --primary: #7a33c7;
      --primary-dark: #5f249d;
      --accent: #e3bc77;
      --border: #eadcf8;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: 'Manrope', system-ui, sans-serif;
      color: var(--text-dark);
      background: linear-gradient(180deg, #1d0a34 0%, #120621 38%, #f6f0ff 38%, #f9f4ff 100%);
      min-height: 100vh;
    }}
    .shell {{ max-width: 1180px; margin: 0 auto; padding: 20px 16px 48px; }}
    .topbar {{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; color:var(--text-light); }}
    .brand {{ display:inline-flex; align-items:center; gap:10px; text-decoration:none; color:var(--text-light); font-family:'Space Grotesk',sans-serif; font-weight:700; letter-spacing:.02em; }}
    .brand-badge {{ width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,var(--accent),#c99642); display:inline-flex; align-items:center; justify-content:center; color:#391a63; font-weight:800; }}
    .top-links {{ display:flex; flex-wrap:wrap; gap:8px; }}
    .top-link {{ color:var(--text-light); text-decoration:none; padding:9px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.2); font-size:13px; }}

    .hero {{
      position: relative;
      overflow: hidden;
      border-radius: 26px;
      padding: 28px;
      background:
        radial-gradient(circle at 8% 12%, rgba(227,188,119,0.34), transparent 35%),
        radial-gradient(circle at 84% 10%, rgba(122,51,199,0.33), transparent 43%),
        linear-gradient(135deg, #2c0d52 0%, #541f86 45%, #8a51bf 100%);
      color: var(--text-light);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 28px 64px rgba(24, 8, 42, 0.38);
    }}
    .hero::after {{
      content: "";
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: 68px 68px;
      opacity: .22;
      pointer-events: none;
    }}
    .eyebrow {{ display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:999px; padding:8px 14px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; font-weight:700; margin-bottom:14px; }}
    .eyebrow-dot {{ width:7px; height:7px; border-radius:50%; background:var(--accent); }}
    h1 {{ margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.02; letter-spacing: -0.03em; max-width: 880px; }}
    .hero p {{ margin:14px 0 0; max-width:760px; color:rgba(248,241,255,0.93); line-height:1.7; }}
    .hero-actions {{ display:flex; flex-wrap:wrap; gap:12px; margin-top:22px; }}
    .btn {{ display:inline-flex; align-items:center; justify-content:center; text-decoration:none; border-radius:999px; padding:11px 17px; font-weight:700; font-size:14px; transition:transform .2s ease; }}
    .btn-primary {{ background:linear-gradient(135deg,var(--accent),#c99642); color:#391a63; box-shadow:0 14px 24px rgba(227,188,119,0.32); }}
    .btn-secondary {{ background:rgba(255,255,255,0.13); border:1px solid rgba(255,255,255,0.26); color:var(--text-light); }}
    .btn:hover {{ transform: translateY(-1px); }}
    .breadcrumbs {{ margin-top:12px; font-size:13px; color:#d9c9ef; }}
    .breadcrumbs a {{ color:#f0dcff; }}

    .metrics {{ margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:10px; }}
    .metric {{ background:rgba(255,255,255,0.11); border:1px solid rgba(255,255,255,0.22); border-radius:14px; padding:12px; }}
    .metric strong {{ display:block; font-size:1.2rem; color:#fff6e7; }}
    .metric span {{ font-size:12px; color:#e8d9fc; }}

    .grid {{ display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:14px; margin-top:16px; }}
    .card {{ background:#fff; border:1px solid var(--border); border-radius:18px; padding:18px; box-shadow:0 10px 22px rgba(75,39,121,0.08); }}
    .card h2, .card h3 {{ margin:0 0 8px; font-size:1.12rem; font-family:'Space Grotesk',sans-serif; color:#281749; letter-spacing:-0.02em; }}
    .muted {{ margin:0; color:var(--muted); font-size:14px; line-height:1.6; }}

    .coverage {{ margin-top:14px; }}
    .chip-row {{ display:flex; flex-wrap:wrap; gap:8px; }}
    .chip {{ display:inline-flex; align-items:center; text-decoration:none; border-radius:999px; padding:8px 12px; font-size:12px; border:1px solid #e6d5f8; background:#fff; color:#492a74; transition:all .2s ease; }}
    .chip:hover {{ border-color:#c99642; color:#6b3e02; background:#fff9ef; }}

    .compliance {{ margin-top:14px; padding:14px; border-radius:14px; border:1px solid #f0d8ad; background:#fff8e8; color:#5d410f; font-size:13px; line-height:1.5; }}
    .footer {{ margin-top:20px; text-align:center; color:#7f7392; font-size:12px; }}

    @media (max-width: 767px) {{
      .hero {{ padding: 20px; border-radius: 20px; }}
      .shell {{ padding: 14px 12px 32px; }}
      .topbar {{ flex-direction: column; align-items: flex-start; }}
    }}
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <a class="brand" href="/"><span class="brand-badge">A</span><span>AMINO-CHAIN</span></a>
      <nav class="top-links">
        <a class="top-link" href="/premium-peptides">Peptides Catalog</a>
        <a class="top-link" href="/peptides-research">Research Library</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <span class="eyebrow"><span class="eyebrow-dot"></span>{type_label} • AMINO-CHAIN</span>
        <h1>Precision Synthesized Peptide Research Support in {region_label}</h1>
        <p>{escape(description)}</p>
        {f'<div class="breadcrumbs">{breadcrumbs} <span>→</span> <strong>{safe_location_name}</strong></div>' if breadcrumbs else ''}

        <div class="hero-actions">
          <a class="btn btn-primary" href="/premium-peptides">Explore Peptides</a>
          <a class="btn btn-secondary" href="/peptides-research">Open Research Library</a>
        </div>

        <div class="metrics">
          <div class="metric"><strong>{county_count}</strong><span>Counties Covered</span></div>
          <div class="metric"><strong>{city_count}</strong><span>Cities Covered</span></div>
          <div class="metric"><strong>99%+</strong><span>Purity Standard</span></div>
          <div class="metric"><strong>24/7</strong><span>Research Access</span></div>
        </div>
      </section>

      <section class="grid">
        <article class="card">
          <h2>Coverage Summary</h2>
          <p class="muted">Location: {region_label}</p>
          <p class="muted">State reference: {safe_state_name}</p>
          <p class="muted">Indexed coverage includes state, county, and city-level entries where available.</p>
        </article>
        <article class="card">
          <h2>Research-First Supply</h2>
          <p class="muted">AMINO-CHAIN provides non-human peptide catalog access, structured product options, and a connected research library for scientific teams.</p>
        </article>
        <article class="card">
          <h2>Need Specific Product Data?</h2>
          <p class="muted">Use our peptides catalog for configurable strengths and vial options, then cross-reference with research pages for context.</p>
          <p style="margin-top:10px;"><a class="btn btn-primary" href="/premium-peptides">Go to Catalog</a></p>
        </article>
      </section>

      {f'<section class="card coverage"><h3>County Coverage</h3><div class="chip-row">{county_links}</div></section>' if county_links else ''}
      {f'<section class="card coverage"><h3>City Coverage</h3><div class="chip-row">{city_links}</div></section>' if city_links else ''}

      <section class="compliance">
        <strong>Compliance Notice:</strong> All products and related content are intended for non-human research use only and are not for human consumption.
      </section>
    </main>

    <footer class="footer">© 2026 AMINO-CHAIN Peptides • Location index: {escape(location_slug)}</footer>
  </div>
</body>
</html>
"""
