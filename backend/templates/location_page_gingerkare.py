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
    logo_url: str = "https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png",
    site_name: str = "GingerKare Custom Emporium",
    phone: str = "(334) 555-0123",
    email: str = "gingerkare44@yahoo.com",
    background_image: str = "https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png",
    video_url: str = "/videos/butterfly_alpha.webm",
) -> str:
    counties = counties or []
    cities = cities or []

    safe_location_name = escape(location_name)
    safe_state_name = escape(state_name)
    state_abbr = STATE_ABBR_MAP.get(state_slug, state_slug[:2].upper())

    if location_type == "state":
        location_slug = state_slug
        location_label = safe_location_name
        title = f"Custom Printables in {safe_location_name} | GingerKare Custom Emporium"
        hero_headline = f"GingerKare Custom Emporium"
        hero_tagline = f"Your Local Custom Printables Destination in {safe_location_name}"
    elif location_type == "county":
        location_slug = f"{_slugify(location_name.replace(' County', ''))}-{state_abbr.lower()}"
        location_label = f"{safe_location_name}, {safe_state_name}"
        title = f"Custom Printables in {safe_location_name}, {safe_state_name} | GingerKare"
        hero_headline = f"GingerKare Custom Emporium"
        hero_tagline = f"Serving {safe_location_name}, {safe_state_name}"
    else:
        location_slug = f"{_slugify(location_name)}-{state_abbr.lower()}"
        location_label = f"{safe_location_name}, {state_abbr}"
        title = f"Custom Printables in {safe_location_name}, {state_abbr} | GingerKare"
        hero_headline = f"GingerKare Custom Emporium"
        hero_tagline = f"Serving {safe_location_name}, {state_abbr}"

    description = (
        f"GingerKare Custom Emporium delivers high-quality custom printables to {location_label}. "
        f"T-shirts, mugs, tumblers, canvas art, stickers, and more. Visit us today!"
    )
    canonical_path = f"/locations/gingerkare-{location_slug}"
    canonical_url = f"{base_url}{canonical_path}"

    json_ld_payload = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "GingerKare Custom Emporium",
        "description": description,
        "url": canonical_url,
        "telephone": phone,
        "email": email,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": location_name if location_type == "city" else "",
            "addressRegion": state_name,
            "addressCountry": "US"
        },
        "areaServed": location_name,
    }

    # Services list
    services = [
        "Custom T-Shirt Printing",
        "Personalized Mugs & Tumblers",
        "Canvas Art & Wall Decor",
        "Stickers & Patches",
        "Flags & Banners",
        "Corporate & Event Orders",
    ]
    services_html = "".join([f'<li><span class="bullet"></span>{s}</li>' for s in services])

    # Hours
    hours_html = """
        <div class="hours-row"><span class="day">Monday - Friday</span><span class="time">9:00 AM - 6:00 PM</span></div>
        <div class="hours-row"><span class="day">Saturday</span><span class="time">10:00 AM - 4:00 PM</span></div>
        <div class="hours-row"><span class="day">Sunday</span><span class="time">Closed</span></div>
    """

    return f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description)}" />
  <meta name="keywords" content="GingerKare, custom printables {escape(location_name)}, t-shirts, mugs, tumblers, canvas art, {escape(location_name)}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{canonical_url}" />
  <meta property="og:site_name" content="GingerKare Custom Emporium" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape(title)}" />
  <meta name="twitter:description" content="{escape(description)}" />
  <link rel="canonical" href="{canonical_url}" />
  <script type="application/ld+json">{json.dumps(json_ld_payload)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {{
      --orange-primary: #ff8c42;
      --orange-dark: #ff6b1a;
      --cream: #ffd4b8;
      --brown-dark: #2c1810;
      --brown-mid: #3a1f12;
      --brown-light: #1a0f0a;
      --white: #ffffff;
      --glass-bg: rgba(255, 255, 255, 0.1);
      --glass-border: rgba(255, 255, 255, 0.2);
    }}
    
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}
    
    body {{
      font-family: 'Inter', sans-serif;
      color: var(--white);
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }}
    
    .background-image {{
      position: fixed;
      inset: 0;
      z-index: 0;
      background-image: url('{background_image}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }}
    
    .video-overlay {{
      position: fixed;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }}
    
    .dark-overlay {{
      position: fixed;
      inset: 0;
      z-index: 10;
      background: linear-gradient(135deg, rgba(44, 24, 16, 0.65), rgba(58, 31, 18, 0.55), rgba(26, 15, 10, 0.65));
    }}
    
    .content {{
      position: relative;
      z-index: 20;
      min-height: 100vh;
    }}
    
    .dev-banner {{
      background: #f59e0b;
      color: #000;
      padding: 0.5rem 1rem;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 600;
    }}
    
    .hero {{
      padding: 8rem 1.5rem 4rem;
      text-align: center;
    }}
    
    .location-badge {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      background: rgba(255, 140, 66, 0.2);
      border: 1px solid rgba(255, 140, 66, 0.5);
      margin-bottom: 1.5rem;
      backdrop-filter: blur(8px);
    }}
    
    .location-badge svg {{
      width: 1rem;
      height: 1rem;
      color: var(--orange-primary);
    }}
    
    .location-badge span {{
      color: var(--cream);
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.05em;
    }}
    
    h1 {{
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 700;
      color: var(--white);
      margin-bottom: 1rem;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }}
    
    .tagline {{
      color: var(--cream);
      font-size: 1.25rem;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }}
    
    .cta-buttons {{
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }}
    
    .btn-primary {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--orange-primary), var(--orange-dark));
      color: var(--white);
      font-weight: 600;
      border-radius: 9999px;
      text-decoration: none;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);
    }}
    
    .btn-primary:hover {{
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 140, 66, 0.4);
    }}
    
    .btn-secondary {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      color: var(--white);
      font-weight: 600;
      border-radius: 9999px;
      text-decoration: none;
      transition: all 0.3s;
    }}
    
    .btn-secondary:hover {{
      background: rgba(255, 255, 255, 0.2);
    }}
    
    .info-cards {{
      padding: 3rem 1.5rem;
    }}
    
    .cards-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }}
    
    .card {{
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 1rem;
      padding: 1.5rem;
    }}
    
    .card h3 {{
      color: var(--orange-primary);
      font-family: 'Playfair Display', serif;
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}
    
    .card h3 svg {{
      width: 1.25rem;
      height: 1.25rem;
    }}
    
    .contact-info p {{
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      color: var(--white);
    }}
    
    .contact-info svg {{
      width: 1.25rem;
      height: 1.25rem;
      color: var(--cream);
      flex-shrink: 0;
      margin-top: 0.125rem;
    }}
    
    .hours-row {{
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      color: var(--white);
    }}
    
    .hours-row .day {{
      color: var(--cream);
    }}
    
    .hours-row .time {{
      font-weight: 600;
    }}
    
    .services-list {{
      list-style: none;
    }}
    
    .services-list li {{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: var(--white);
    }}
    
    .services-list .bullet {{
      width: 0.375rem;
      height: 0.375rem;
      background: var(--orange-primary);
      border-radius: 50%;
    }}
    
    .cta-section {{
      padding: 4rem 1.5rem;
    }}
    
    .cta-box {{
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      background: linear-gradient(135deg, rgba(255, 140, 66, 0.2), rgba(147, 112, 219, 0.2));
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 1.5rem;
      padding: 3rem 2rem;
    }}
    
    .cta-box h2 {{
      font-family: 'Playfair Display', serif;
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      font-weight: 700;
      color: var(--white);
      margin-bottom: 1rem;
    }}
    
    .cta-box p {{
      color: var(--cream);
      font-size: 1.125rem;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }}
    
    .cta-box .cta-buttons {{
      gap: 1rem;
    }}
    
    .cta-box .btn-primary,
    .cta-box .btn-secondary {{
      padding: 1rem 2rem;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    
    footer {{
      padding: 2rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }}
    
    footer p {{
      color: rgba(255, 212, 184, 0.7);
      font-size: 0.875rem;
    }}
    
    @media (max-width: 768px) {{
      .hero {{
        padding: 6rem 1rem 3rem;
      }}
      
      .cta-buttons {{
        flex-direction: column;
        align-items: center;
      }}
      
      .btn-primary,
      .btn-secondary {{
        width: 100%;
        max-width: 280px;
        justify-content: center;
      }}
    }}
  </style>
</head>
<body>
  <!-- Background Image -->
  <div class="background-image"></div>
  
  <!-- Video Overlay -->
  <video class="video-overlay" autoplay muted loop playsinline>
    <source src="{video_url}" type="video/webm" />
  </video>
  
  <!-- Dark Overlay -->
  <div class="dark-overlay"></div>
  
  <!-- Content -->
  <div class="content">
    <!-- Dev Preview Banner -->
    <div class="dev-banner">
      DEV PREVIEW MODE - This is a sample location page template
    </div>
    
    <!-- Hero Section -->
    <section class="hero">
      <div class="location-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{safe_location_name}, {state_abbr}</span>
      </div>
      
      <h1>{hero_headline}</h1>
      <p class="tagline">{hero_tagline}</p>
      
      <div class="cta-buttons">
        <a href="tel:{phone}" class="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Call Now
        </a>
        <a href="https://maps.google.com/?q=Dothan,+Alabama" target="_blank" rel="noopener" class="btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Get Directions
        </a>
      </div>
    </section>
    
    <!-- Info Cards -->
    <section class="info-cards">
      <div class="cards-grid">
        <!-- Contact Card -->
        <div class="card">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Contact
          </h3>
          <div class="contact-info">
            <p>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>123 Main Street<br/>Dothan, Alabama 36301</span>
            </p>
            <p>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{phone}</span>
            </p>
            <p>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>{email}</span>
            </p>
          </div>
        </div>
        
        <!-- Hours Card -->
        <div class="card">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Hours
          </h3>
          {hours_html}
        </div>
        
        <!-- Services Card -->
        <div class="card">
          <h3>Services</h3>
          <ul class="services-list">
            {services_html}
          </ul>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-box">
        <h2>Ready to Create Something Special?</h2>
        <p>Visit us today or browse our online catalog. Custom orders welcome!</p>
        <div class="cta-buttons">
          <a href="/shop" class="btn-primary">Shop Online</a>
          <a href="/contact" class="btn-secondary">Request Quote</a>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer>
      <p>&copy; 2024 GingerKare Custom Emporium. All rights reserved.</p>
    </footer>
  </div>
  
  <script>
    // Auto-play video
    document.addEventListener('DOMContentLoaded', function() {{
      const video = document.querySelector('.video-overlay');
      if (video) {{
        video.play().catch(function() {{}});
      }}
    }});
  </script>
</body>
</html>
"""
