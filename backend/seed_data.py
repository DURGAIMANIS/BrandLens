"""
Seed data for Nova Outdoor Gear brand guidelines, approved facts, terminology,
color palette, and 3 sample drafts with planted mistakes.
"""

COMPANY_NAME = "Nova Outdoor Gear"

BRAND_PALETTE = [
    {"name": "Forest Green", "hex": "#1B4332", "role": "primary", "usage": "Primary brand colour, headers, key buttons"},
    {"name": "Mountain Sage", "hex": "#40916C", "role": "secondary", "usage": "Accents, badges, highlights"},
    {"name": "Alpine Gold", "hex": "#DDA15E", "role": "accent", "usage": "Subtle accents only; low contrast against white"},
    {"name": "Granite Gray", "hex": "#343A40", "role": "dark-neutral", "usage": "Primary body copy and dark containers"},
    {"name": "Snow White", "hex": "#F8F9FA", "role": "light-neutral", "usage": "Backgrounds, card surfaces"},
    {"name": "Earth Ochre", "hex": "#BC6C25", "role": "earth-accent", "usage": "Warm badges, seasonal highlights"}
]

SEED_CLAUSES = [
    # Tone guidelines (5)
    {
        "code": "NOV-TONE-01",
        "category": "tone",
        "title": "Respectful and Welcoming Voice",
        "text": "Nova speaks as an encouraging mountain guide: humble, knowledgeable, welcoming, and never condescending or aggressive.",
        "rationale": "Our community values inclusivity and thoughtful preparation over bravado or fear of missing out."
    },
    {
        "code": "NOV-TONE-02",
        "category": "tone",
        "title": "No Fear-Based or High-Pressure Urgency",
        "text": "Never shame the reader or use aggressive FOMO tactics like 'Buy now or you will regret it' or 'Don't be lazy'.",
        "rationale": "High-pressure tactics erode trust and run counter to our mindful exploration ethos."
    },
    {
        "code": "NOV-TONE-03",
        "category": "tone",
        "title": "Inspiring yet Grounded Language",
        "text": "Inspire outdoor discovery through authentic trail experiences rather than exaggerated hyperbole.",
        "rationale": "Hikers appreciate genuine practical descriptions over dramatic storytelling."
    },
    {
        "code": "NOV-TONE-04",
        "category": "tone",
        "title": "Stewardship over Conquest",
        "text": "Portray the wilderness as a sacred sanctuary to protect and coexist with, never as a territory to conquer, dominate, or defeat.",
        "rationale": "We practice Leave No Trace principles."
    },
    {
        "code": "NOV-TONE-05",
        "category": "tone",
        "title": "Inclusive Exploration",
        "text": "Encourage beginners alongside seasoned mountaineers without elitist jargon or gatekeeping.",
        "rationale": "The trail belongs to everyone regardless of experience level."
    },

    # Terminology guidelines (5)
    {
        "code": "NOV-TERM-01",
        "category": "terminology",
        "title": "Value over Cheapness",
        "text": "Never refer to Nova gear or materials as 'cheap'. Always use 'accessible', 'high-value', or 'fairly priced'.",
        "rationale": "The word 'cheap' implies inferior quality and disposable construction."
    },
    {
        "code": "NOV-TERM-02",
        "category": "terminology",
        "title": "Water Resistance vs Waterproof",
        "text": "Do not label garments as 'waterproof' unless they carry a certified hydrostatic head rating of 20,000mm or higher. Otherwise use 'weather-resistant' or 'water-repellent'.",
        "rationale": "Misleading waterproof ratings lead to field failures and customer safety risks."
    },
    {
        "code": "NOV-TERM-03",
        "category": "terminology",
        "title": "Official Product Nomenclature",
        "text": "Always write product names in full: 'Apex Shell Jacket', 'Summit Ultralight Tent', 'TrailPro Alpine Boot'. Do not abbreviate to slang or lowercase.",
        "rationale": "Standard product naming maintains brand recognition and search clarity."
    },
    {
        "code": "NOV-TERM-04",
        "category": "terminology",
        "title": "Responsible Material Claims",
        "text": "Avoid vague buzzwords like 'eco-friendly' or 'green'. Specify exact certified attributes such as '100% recycled ripstop nylon' or 'bluesign certified'.",
        "rationale": "Combat greenwashing with verifiable certifications."
    },
    {
        "code": "NOV-TERM-05",
        "category": "terminology",
        "title": "Inclusive Safety Terminology",
        "text": "Refer to independent hikers as 'solo backcountry travellers' or 'solo hikers', never 'hiking alone' in an alarming context.",
        "rationale": "Promote preparation and self-reliance rather than hazard sensationalism."
    },

    # Messaging guidelines (5)
    {
        "code": "NOV-MSG-01",
        "category": "messaging",
        "title": "Durability and Repairability",
        "text": "Emphasize longevity, repair kits, and our lifetime repair guarantee over fast seasonal replacement cycles.",
        "rationale": "Building durable gear reduces landfill waste."
    },
    {
        "code": "NOV-MSG-02",
        "category": "messaging",
        "title": "Leave No Trace Commitment",
        "text": "All campaign communications must reinforce Leave No Trace principles and responsible trail etiquette.",
        "rationale": "Core corporate value since 2018."
    },
    {
        "code": "NOV-MSG-03",
        "category": "messaging",
        "title": "Respectful Competitive Positioning",
        "text": "Focus on our craftsmanship and material choices; do not denigrate or name competitor brands in public marketing.",
        "rationale": "Confidence in our gear speaks louder than mudslinging."
    },
    {
        "code": "NOV-MSG-04",
        "category": "messaging",
        "title": "Transparent Production",
        "text": "Highlight our fair-wage partner factories in Portugal and Oregon with verifiable supply chain audits.",
        "rationale": "Ethical manufacturing is a primary customer purchase driver."
    },
    {
        "code": "NOV-MSG-05",
        "category": "messaging",
        "title": "Community-Driven Feedback",
        "text": "Highlight that Nova gear is co-designed and field-tested with volunteer trail crews and mountain rescue teams.",
        "rationale": "Authentic validation from everyday field stewards."
    },

    # Claims guidelines (5)
    {
        "code": "NOV-CLM-01",
        "category": "claims",
        "title": "Substantiation of Customer Metrics",
        "text": "Any percentage claim regarding customer satisfaction, preference, or reliability must cite an approved survey from the internal Fact Library.",
        "rationale": "Regulatory compliance under FTC advertising guidelines."
    },
    {
        "code": "NOV-CLM-02",
        "category": "claims",
        "title": "Prohibition of Unsubstantiated Superlatives",
        "text": "Do not use unqualified superlatives such as 'the absolute best', 'No.1 ranked in the world', or 'guaranteed 100% indestructible' unless backed by external certified awards.",
        "rationale": "Superlatives without third-party proof are deceptive and legally risky."
    },
    {
        "code": "NOV-CLM-03",
        "category": "claims",
        "title": "Accurate Pricing and Promotions",
        "text": "Product prices cited in copy must match the current active retail price schedule in the Fact Library.",
        "rationale": "Misquoted prices lead to consumer complaints and checkout abandonments."
    },
    {
        "code": "NOV-CLM-04",
        "category": "claims",
        "title": "Elevation and Climate Limits",
        "text": "Never claim gear is tested beyond certified laboratory and field limits (e.g. Summit Tent is rated to 14,000 ft / 45 mph wind, not 50,000 ft).",
        "rationale": "Extreme claims jeopardize mountaineer safety."
    },
    {
        "code": "NOV-CLM-05",
        "category": "claims",
        "title": "Warranty Limitations",
        "text": "Describe our warranty as 'Lifetime Repair Warranty against manufacturing defects'—never claim it covers accidental campfire burns, pet damage, or commercial misuse.",
        "rationale": "Clear terms prevent warranty claim disputes."
    },

    # Visual guidelines (4)
    {
        "code": "NOV-VIS-01",
        "category": "visual",
        "title": "Brand Palette Adherence",
        "text": "Visual assets and banners must prominently feature Forest Green (#1B4332), Mountain Sage (#40916C), and Granite Gray (#343A40) as primary tones.",
        "rationale": "Ensures instant recognition across outdoor media."
    },
    {
        "code": "NOV-VIS-02",
        "category": "visual",
        "title": "Accent Color Restraint",
        "text": "Alpine Gold (#DDA15E) and Earth Ochre (#BC6C25) are secondary accents and must not exceed 20% of the visual layout area.",
        "rationale": "Prevents visual fatigue and maintains earthy serenity."
    },
    {
        "code": "NOV-VIS-03",
        "category": "visual",
        "title": "Authentic Trail Imagery",
        "text": "Photographs must depict real hikers wearing realistic trail dust and weather layers, never studio mannequins or pristine staged glamour.",
        "rationale": "Credibility among real outdoor enthusiasts."
    },
    {
        "code": "NOV-VIS-04",
        "category": "visual",
        "title": "Leave No Trace Visuals",
        "text": "Images must never show vehicles parked on fragile alpine meadows, campfires outside designated rings, or trash in the background.",
        "rationale": "Visual role-modeling of environmental stewardship."
    },

    # Accessibility guidelines (4)
    {
        "code": "NOV-ACC-01",
        "category": "accessibility",
        "title": "Descriptive Image Alternative Text",
        "text": "Every image must have descriptive alt text explaining the scene, subject, gear featured, and environmental context.",
        "rationale": "WCAG 2.1 AA requirement for visually impaired readers."
    },
    {
        "code": "NOV-ACC-02",
        "category": "accessibility",
        "title": "WCAG AA Contrast Ratio",
        "text": "Text placed over background colours must achieve at least 4.5:1 contrast for normal text and 3:1 for large display text. Warning: Alpine Gold (#DDA15E) fails against white backgrounds.",
        "rationale": "Legibility in high-glare outdoor environments."
    },
    {
        "code": "NOV-ACC-03",
        "category": "accessibility",
        "title": "Clear Readable Typography",
        "text": "Maintain high contrast against body backgrounds with font sizes no smaller than 14px on mobile devices.",
        "rationale": "Readable on mobile phones on sunny trailheads."
    },
    {
        "code": "NOV-ACC-04",
        "category": "accessibility",
        "title": "Meaningful Link and Button Labels",
        "text": "Buttons and links must specify target action clearly (e.g. 'View Apex Shell Jacket Specs', never vague 'Click here' or 'Read more').",
        "rationale": "Assists screen reader navigation and cognitive accessibility."
    }
]

SEED_FACTS = [
    {
        "code": "FACT-01",
        "topic": "Customer Satisfaction",
        "statement": "92% of surveyed customers rate Nova gear as highly reliable in mountain conditions.",
        "value": "92%",
        "source": "2024 Nova Annual Customer Survey (N=4,200)",
        "valid_until": "2025-12-31"
    },
    {
        "code": "FACT-02",
        "topic": "Apex Shell Jacket Current Price",
        "statement": "The official retail price of the Apex Shell Jacket is $189 USD.",
        "value": "$189",
        "source": "2024 Product Catalog & ERP Schedule v4",
        "valid_until": "2025-12-31"
    },
    {
        "code": "FACT-03",
        "topic": "Apex Shell Jacket 2023 Outdated Price",
        "statement": "The historical 2023 introductory launch price was $149 USD (Discontinued).",
        "value": "$149",
        "source": "2023 Promotional Archive (Expired)",
        "valid_until": "2023-12-31"  # EXPIRED FACT!
    },
    {
        "code": "FACT-04",
        "topic": "Fabric Material Composition",
        "statement": "Apex Shell Jacket is built from 100% recycled ripstop nylon with PFC-free DWR coating.",
        "value": "100% recycled ripstop nylon",
        "source": "Material Lab Certification #ML-881",
        "valid_until": "permanent"
    },
    {
        "code": "FACT-05",
        "topic": "TrailPro Boot Waterproof Rating",
        "statement": "TrailPro Alpine Boot features a 15,000mm hydrostatic head membrane.",
        "value": "15,000mm",
        "source": "Independent Lab Report EN-343",
        "valid_until": "permanent"
    },
    {
        "code": "FACT-06",
        "topic": "Summit Tent Weight",
        "statement": "The Summit Ultralight Tent has a trail weight of 3.4 lbs (1.54 kg).",
        "value": "3.4 lbs",
        "source": "Engineering Spec Sheet v2.1",
        "valid_until": "2025-12-31"
    },
    {
        "code": "FACT-07",
        "topic": "Summit Tent Altitude Certification",
        "statement": "The Summit Tent is wind tunnel and field certified up to 14,000 ft elevation and 45 mph gusts.",
        "value": "14,000 ft",
        "source": "Cascade Alpine Safety Institute Testing 2023",
        "valid_until": "2025-12-31"
    },
    {
        "code": "FACT-08",
        "topic": "Warranty Coverage",
        "statement": "Nova provides a Lifetime Repair Guarantee covering manufacturer defects and seam failures.",
        "value": "Lifetime Repair Guarantee",
        "source": "Nova Customer Policy Handbook 2024",
        "valid_until": "permanent"
    },
    {
        "code": "FACT-09",
        "topic": "Global Carbon Offset",
        "statement": "Nova offsets 100% of outbound freight emissions through verified forestry projects.",
        "value": "100%",
        "source": "Climate Impact Verification Report 2024",
        "valid_until": "2025-06-30"
    },
    {
        "code": "FACT-10",
        "topic": "Member Discount",
        "statement": "Nova Trail Club members receive 15% off seasonal purchases.",
        "value": "15%",
        "source": "Membership Rewards Schedule 2024",
        "valid_until": "2025-12-31"
    },
    {
        "code": "FACT-11",
        "topic": "Manufacturing Partners",
        "statement": "All apparel is manufactured in fair-wage facilities located in Porto, Portugal and Bend, Oregon.",
        "value": "Porto, Portugal and Bend, Oregon",
        "source": "Fair Labor Association Annual Audit 2023",
        "valid_until": "2025-12-31"
    }
]

SEED_TERMS = [
    {
        "banned_term": "cheap",
        "preferred_term": "accessible / high-value",
        "category": "terminology",
        "reason": "Implies inferior quality and poor durability. Use accessible or high-value instead.",
        "rule_code": "NOV-TERM-01"
    },
    {
        "banned_term": "cheap alternative",
        "preferred_term": "high-value alternative",
        "category": "terminology",
        "reason": "Avoid disparaging our gear as cut-rate or shoddy.",
        "rule_code": "NOV-TERM-01"
    },
    {
        "banned_term": "waterproof",
        "preferred_term": "weather-resistant",
        "category": "claims",
        "reason": "Only products with 20,000mm+ rating can claim waterproof. Apex Shell is weather-resistant (15,000mm).",
        "rule_code": "NOV-TERM-02"
    },
    {
        "banned_term": "foolproof",
        "preferred_term": "intuitive",
        "category": "tone",
        "reason": "Patronizing tone towards beginner hikers. Use intuitive or user-friendly.",
        "rule_code": "NOV-TONE-01"
    },
    {
        "banned_term": "eco-friendly",
        "preferred_term": "100% recycled ripstop nylon",
        "category": "claims",
        "reason": "Vague greenwashing buzzword. State the exact certified recycled material.",
        "rule_code": "NOV-TERM-04"
    },
    {
        "banned_term": "hiking alone",
        "preferred_term": "solo backcountry exploration",
        "category": "tone",
        "reason": "Alarmist phrasing. Frame independent trekking as empowered solo exploration.",
        "rule_code": "NOV-TERM-05"
    },
    {
        "banned_term": "bulletproof",
        "preferred_term": "tear-resistant ripstop",
        "category": "terminology",
        "reason": "Avoid militarized or violent jargon for peaceful outdoor recreation gear.",
        "rule_code": "NOV-TONE-03"
    },
    {
        "banned_term": "conquer the mountain",
        "preferred_term": "experience the alpine wilderness",
        "category": "tone",
        "reason": "Violates our stewardship ethos. We respect nature, not conquer it.",
        "rule_code": "NOV-TONE-04"
    },
    {
        "banned_term": "insane discount",
        "preferred_term": "member-exclusive pricing",
        "category": "tone",
        "reason": "Flashy retail hype inconsistent with grounded mountain guide tone.",
        "rule_code": "NOV-TONE-02"
    },
    {
        "banned_term": "competitor brands",
        "preferred_term": "traditional outerwear",
        "category": "messaging",
        "reason": "Never reference or attack competitors directly.",
        "rule_code": "NOV-MSG-03"
    }
]

# 3 Pre-seeded drafts with planted mistakes
SEED_SAMPLE_DRAFTS = [
    {
        "id_key": "sample-1",
        "title": "Apex Jacket Q4 Launch Announcement",
        "author_role": "Creator",
        "target_intent": "Announce the Q4 launch of the Apex Jacket with an inspiring and friendly tone",
        "content": (
            "We are thrilled to unveil the new Apex Shell Jacket for winter adventures! "
            "Grab this cheap alternative to heavy parkas for only $149 before stocks run out. "
            "Independent tests show that 98% of customers prefer us over all competitors. "
            "Crafted with eco-friendly fabrics, it is simply the absolute best waterproof jacket on the market."
        ),
        "mistakes_summary": [
            "Outdated price: $149 (Approved current price is $189, FACT-02 vs expired FACT-03)",
            "Unsupported percentage claim: '98% of customers prefer us' (Approved fact is 92% satisfaction, FACT-01)",
            "Banned term: 'cheap alternative' (Violates NOV-TERM-01, prefer 'high-value alternative')",
            "Banned term: 'eco-friendly' (Violates NOV-TERM-04, use exact certified fabric)",
            "Unsubstantiated superlative & claim: 'the absolute best waterproof jacket' (Violates NOV-CLM-02 and NOV-TERM-02)"
        ]
    },
    {
        "id_key": "sample-2",
        "title": "Weekend Flash Sale & Trail Push",
        "author_role": "Creator",
        "target_intent": "Promote our weekend member promotion and invite hikers to explore the trails",
        "content": (
            "Listen up hikers: buy this now or you will regret it! Don't be lazy and stay on the couch all autumn. "
            "Our Summit Ultralight Tent is guaranteed 100% indestructible and rigorously tested up to 50,000 feet in extreme blizzards. "
            "Get an insane discount of 40% off this weekend only to conquer the mountain!"
        ),
        "mistakes_summary": [
            "Aggressive FOMO/shaming tone: 'buy this now or you will regret it! Don't be lazy' (Violates NOV-TONE-02)",
            "Exaggerated altitude claim: 'tested up to 50,000 feet' (Violates NOV-CLM-04, tested limit is 14,000 ft, FACT-07)",
            "Unsubstantiated superlative: 'guaranteed 100% indestructible' (Violates NOV-CLM-02 and NOV-CLM-05)",
            "Banned term: 'insane discount' (Violates NOV-TONE-02)",
            "Banned ethos phrase: 'conquer the mountain' (Violates NOV-TONE-04, prefer 'experience the alpine wilderness')"
        ]
    },
    {
        "id_key": "sample-3",
        "title": "Visual Gear Guide & Trail Safety Notes",
        "author_role": "Creator",
        "target_intent": "A visual guide for solo backpackers with trail safety notes and gear highlights",
        "content": (
            "Before heading out, remember that hiking alone requires careful route planning. "
            "Our bulletproof TrailPro Alpine Boot keeps feet dry in unpredictable storms. "
            "As the No.1 ranked expedition gear in the world, we lead the industry. "
            "Visual preview: <img src=\"/images/boots.jpg\" /> with banner badge styled in #DDA15E over #F8F9FA background."
        ),
        "mistakes_summary": [
            "Banned phrasing: 'hiking alone' (Violates NOV-TERM-05, use 'solo backcountry exploration')",
            "Banned violent slang: 'bulletproof' (Violates NOV-TERM-01 / NOV-TONE-03, use 'tear-resistant ripstop')",
            "Unsubstantiated superlative: 'No.1 ranked expedition gear in the world' (Violates NOV-CLM-02, Unsupported)",
            "Accessibility visual issue: image tag `<img src=\"/images/boots.jpg\" />` has no alt text (Violates NOV-ACC-01)",
            "Accessibility contrast issue: Alpine Gold `#DDA15E` over Snow White `#F8F9FA` fails WCAG AA 4.5:1 ratio (Violates NOV-ACC-02)"
        ]
    }
]

