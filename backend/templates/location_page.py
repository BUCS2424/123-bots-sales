from html import escape


def generate_location_page_html(
    location_name: str,
    location_type: str,
    state_name: str,
    state_slug: str,
    county_count: int = 0,
    city_count: int = 0,
    counties: list | None = None,
    cities: list | None = None,
) -> str:
    counties = counties or []
    cities = cities or []

    safe_location_name = escape(location_name)
    safe_state_name = escape(state_name)

    if location_type == "state":
        title = f"Peptide Research Supply in {safe_location_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research in {safe_location_name}. "
            f"Coverage includes {county_count} counties and {city_count} cities."
        )
        type_label = "State"
    elif location_type == "county":
        title = f"Peptide Research Supply in {safe_location_name}, {safe_state_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research workflows in {safe_location_name}, {safe_state_name}."
        )
        type_label = "County"
    else:
        title = f"Peptide Research Supply in {safe_location_name}, {safe_state_name} | AMINO-CHAIN"
        description = (
            f"AMINO-CHAIN supports non-human peptide research teams in {safe_location_name}, {safe_state_name}."
        )
        type_label = "City"

    county_badges = "".join(
        [f'<span class="badge">{escape(county)}</span>' for county in counties[:30]]
    )
    city_badges = "".join(
        [f'<span class="badge">{escape(city)}</span>' for city in cities[:50]]
    )

    return f"""
<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{title}</title>
  <meta name=\"description\" content=\"{description}\" />
  <meta name=\"robots\" content=\"index,follow\" />
  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin:0; color:#1f2937; background:#f8fafc; }}
    .wrap {{ max-width: 980px; margin: 0 auto; padding: 28px 16px 40px; }}
    .hero {{ border-radius: 16px; padding: 24px; background: linear-gradient(135deg,#2d0f49,#6e2ea8 55%,#b9893d); color: white; }}
    .eyebrow {{ font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity:.9; }}
    h1 {{ margin:8px 0 8px; font-size: 36px; line-height:1.1; }}
    p {{ line-height:1.6; }}
    .grid {{ margin-top: 20px; display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); }}
    .card {{ background:white; border:1px solid #e5e7eb; border-radius: 14px; padding: 16px; }}
    .badge-list {{ display:flex; flex-wrap: wrap; gap:8px; margin-top:10px; }}
    .badge {{ display:inline-block; border:1px solid #e5e7eb; padding:6px 10px; border-radius: 999px; font-size:12px; background:#fff; }}
    .cta {{ display:inline-block; margin-top:14px; background:#6e2ea8; color:#fff; text-decoration:none; padding:11px 16px; border-radius:999px; font-weight:600; }}
    .subtle {{ color:#6b7280; font-size:14px; }}
  </style>
</head>
<body>
  <div class=\"wrap\">
    <section class=\"hero\">
      <div class=\"eyebrow\">AMINO-CHAIN • {type_label}</div>
      <h1>{safe_location_name}</h1>
      <p>{description}</p>
      <a class=\"cta\" href=\"/premium-peptides\">Explore Peptides Catalog</a>
    </section>

    <section class=\"grid\">
      <article class=\"card\">
        <h3>Research Coverage</h3>
        <p class=\"subtle\">State: {safe_state_name}</p>
        <p class=\"subtle\">Counties indexed: {county_count}</p>
        <p class=\"subtle\">Cities indexed: {city_count}</p>
      </article>
      <article class=\"card\">
        <h3>Compliance Notice</h3>
        <p class=\"subtle\">Products are for non-human research use only and not intended for human consumption.</p>
      </article>
      <article class=\"card\">
        <h3>Quick Links</h3>
        <a class=\"cta\" href=\"/peptides-research\">Open Research Library</a>
      </article>
    </section>

    {f'<section class="card" style="margin-top:16px;"><h3>Sample Counties</h3><div class="badge-list">{county_badges}</div></section>' if county_badges else ''}
    {f'<section class="card" style="margin-top:16px;"><h3>Sample Cities</h3><div class="badge-list">{city_badges}</div></section>' if city_badges else ''}
  </div>
</body>
</html>
"""
