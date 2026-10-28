export interface Faq {
  question: string;
  answer: string;
}

/**
 * The questions people actually type, taken from the long-tail list in the Growth &
 * SEO guide and answered honestly rather than padded with keywords.
 *
 * Keyed by `Service.key` so a service page picks up its own questions. They are also
 * published as a FAQPage node, which is what can win the expandable answers under a
 * search result — and a wrong or evasive answer there is worse than no answer.
 *
 * Services with nothing worth asking are simply absent; FAQs are optional.
 */
export const SERVICE_FAQS: Readonly<Record<string, readonly Faq[]>> = {
  maintenance: [
    {
      question: $localize`:@@faq.maintenance.q1:What belongs in a cleaning specification?`,
      answer: $localize`:@@faq.maintenance.a1:A usable specification lists every room or zone, what happens in it at which interval, and who supplies the consumables. Ours separates daily, weekly and monthly work so you can see what you are paying for and change an interval without renegotiating the contract.`,
    },
    {
      question: $localize`:@@faq.maintenance.q2:How often should an office be cleaned?`,
      answer: $localize`:@@faq.maintenance.a2:Sanitary facilities and kitchens need daily attention in any office that is occupied every day. Desks and floors usually work on two or three visits a week, with a deep clean once or twice a year. Reception and meeting rooms are the exception: they are what visitors see, so they are worth a daily pass.`,
    },
  ],
  office: [
    {
      question: $localize`:@@faq.office.q1:What does office cleaning cost per square metre in Dresden?`,
      answer: $localize`:@@faq.office.a1:Most offices in Dresden land somewhere around one to two euros per square metre per month at two or three visits a week, but the honest answer is that floor type, sanitary facilities and how much furniture has to be worked around move that figure more than the floor area does. We quote a fixed price after a free site visit.`,
    },
    {
      question: $localize`:@@faq.office.q2:Do you clean outside business hours?`,
      answer: $localize`:@@faq.office.a2:Yes, and for most offices we recommend it. We work before opening or after closing so nobody is cleaning around occupied desks. Key handover, alarm codes and access rules are agreed in writing before the first visit.`,
    },
  ],
  school: [
    {
      question: $localize`:@@faq.school.q1:How often does a classroom have to be cleaned?`,
      answer: $localize`:@@faq.school.a1:Floors, waste bins and contact surfaces such as door handles and taps are a daily job in an occupied classroom, and sanitary facilities usually need more than one pass a day. The exact rhythm is set by the school's hygiene plan, which we work to rather than replace.`,
    },
    {
      question: $localize`:@@faq.school.q2:Can the deep clean happen during the summer holidays?`,
      answer: $localize`:@@faq.school.a2:That is when it should happen. The holidays are the only window long enough to strip and reseal floors, move furniture and bring sports halls back to standard. We plan that calendar with you a term ahead so the work is finished before the first day of term, not during it.`,
    },
  ],
  medical: [
    {
      question: $localize`:@@faq.medical.q1:What does a hygiene plan require of a cleaning company?`,
      answer: $localize`:@@faq.medical.a1:It sets which surfaces are disinfected rather than cleaned, with what, in which order, and how often. In practice it also means separate equipment per zone so nothing travels from a treatment room to a waiting area, staff trained for the setting, and a record of each visit that survives an inspection.`,
    },
    {
      question: $localize`:@@faq.medical.q2:Do you clean care homes as well as practices?`,
      answer: $localize`:@@faq.medical.a2:Yes — care homes, senior residences, health centres, physiotherapy and dental practices. Full hospital cleaning of operating theatres and intensive care needs validated procedures we do not yet offer, and we would rather say so than take the contract.`,
    },
  ],
  publicSector: [
    {
      question: $localize`:@@faq.publicSector.q1:Which documents does a cleaning tender ask for?`,
      answer: $localize`:@@faq.publicSector.a1:Typically a trade register entry, clearance certificates from the tax office, health insurers and the trade association, proof of liability insurance, a reference list, and a declaration of collective wage compliance. We keep that folder current, which is why a short deadline is not a reason for us to skip a tender.`,
    },
    {
      question: $localize`:@@faq.publicSector.q2:Are you too small for a public contract?`,
      answer: $localize`:@@faq.publicSector.a2:For a region-wide framework, yes. For a single school, office building or administrative site — the size most lots are actually split into — being local is an advantage: short travel times, a named contact and a team that stays the same.`,
    },
  ],
  industrial: [
    {
      question: $localize`:@@faq.industrial.q1:Can you clean during shift operation?`,
      answer: $localize`:@@faq.industrial.a1:Yes. We plan around the lines that keep running and work nights and weekends where that is the only usable window. Before the first visit we walk the site with your safety officer so access rules, protective equipment and permit areas are settled in advance.`,
    },
    {
      question: $localize`:@@faq.industrial.q2:What does industrial cleaning actually cover?`,
      answer: $localize`:@@faq.industrial.a2:Production halls, warehouses, workshops, industrial floors and the area around machinery, plus the social rooms and changing facilities that are easy to forget and the first thing staff notice. Each is priced separately because each needs different equipment and intervals.`,
    },
  ],
  housing: [
    {
      question: $localize`:@@faq.housing.q1:What does stairwell cleaning cost in an apartment building?`,
      answer: $localize`:@@faq.housing.a1:It depends on the number of floors, whether there is a lift, and whether windows and bin stores are included. A typical Dresden building on a weekly rhythm is a modest per-unit cost on the service charge — and bundling it with grounds care and winter service on one contract is usually cheaper than three separate ones.`,
    },
    {
      question: $localize`:@@faq.housing.q2:Can you handle cleaning, grounds and winter service together?`,
      answer: $localize`:@@faq.housing.a2:That is how we prefer to work with property managers: one contract, one invoice and one person to call. It also means nobody argues about whether leaves on the path are the gardener's job or the cleaner's.`,
    },
  ],
  glass: [
    {
      question: $localize`:@@faq.glass.q1:How often should office windows be cleaned?`,
      answer: $localize`:@@faq.glass.a1:Twice a year is the usual minimum for an office. Ground-floor glass, entrances and anything facing a busy road need four times a year or more. Shop windows are their own case — most of our retail clients book monthly.`,
    },
    {
      question: $localize`:@@faq.glass.q2:Can you clean solar panels without damaging them?`,
      answer: $localize`:@@faq.glass.a2:Yes, with purified water and equipment made for the surface. The risk is real: the wrong brush leaves micro-scratches that cost yield for the rest of the panel's life, which is why we never use the same kit we use on a facade.`,
    },
  ],
  deepClean: [
    {
      question: $localize`:@@faq.deepClean.q1:How quickly can you do a builders' clean?`,
      answer: $localize`:@@faq.deepClean.a1:For a flat or a small office, usually within a few days of asking, and we can often work weekends to hit a handover date. Tell us the handover date first — it is the only fixed point in the job, and we plan the rough clean and the fine clean backwards from it.`,
    },
    {
      question: $localize`:@@faq.deepClean.q2:What happens after water damage?`,
      answer: $localize`:@@faq.deepClean.a2:Call us and your insurer on the same day. We can usually be on site within hours to remove standing water and start drying, but we document the state before we touch anything and work alongside the assessor, because cleaning up ahead of them can cost you the claim.`,
    },
  ],
  winter: [
    {
      question: $localize`:@@faq.winter.q1:Who is liable for ice on the pavement outside a building?`,
      answer: $localize`:@@faq.winter.a1:The property owner, and the duty can be passed to a tenant or a contractor by agreement. What does not pass is the obligation to prove it was met: after an accident it is the owner who has to show the path was cleared and gritted. A winter service contract with a written log is that proof.`,
    },
    {
      question: $localize`:@@faq.winter.q2:When does snow have to be cleared in Dresden?`,
      answer: $localize`:@@faq.winter.a2:On working days from 07:00 to 20:00, and from 08:00 on Sundays and public holidays, with clearing repeated if it keeps snowing. We start before those times so your entrance is safe when the first person arrives rather than while they are waiting.`,
    },
  ],
  gardening: [
    {
      question: $localize`:@@faq.gardening.q1:What does leaf clearing cost?`,
      answer: $localize`:@@faq.gardening.a1:As a one-off it is priced by area and how much there is to take away. On a yearly contract it is already covered, which is why most clients with trees on the property choose the contract — autumn is exactly when a one-off is hardest to book at short notice.`,
    },
    {
      question: $localize`:@@faq.gardening.q2:Do you take the green waste away?`,
      answer: $localize`:@@faq.gardening.a2:Yes. Cuttings and leaves are removed and disposed of properly, and the disposal is included in the quoted price rather than appearing afterwards as an extra.`,
    },
  ],
  facility: [
    {
      question: $localize`:@@faq.facility.q1:Can I get caretaking and cleaning from one provider?`,
      answer: $localize`:@@faq.facility.a1:Yes, and for most properties it is the cheaper arrangement: one contract, one invoice, one contact, and nobody to point at when something falls between two jobs. We can also add winter service and grounds care to the same agreement.`,
    },
    {
      question: $localize`:@@faq.facility.q2:What do you do with what you clear out?`,
      answer: $localize`:@@faq.facility.a2:We separate what can be reused or recycled from what cannot, dispose of the rest through licensed channels, and hand you the disposal receipts. For an estate clearance we agree in advance what is kept, and nothing of value is thrown away without asking.`,
    },
  ],
  home: [
    {
      question: $localize`:@@faq.home.q1:Will the move-out clean get my deposit back?`,
      answer: $localize`:@@faq.home.a1:We clean to the standard landlords and agents actually inspect against: windows, inside cupboards, the oven, limescale, and the marks behind appliances. We cannot promise what a landlord will decide, but we can tell you before we start if something in the flat is damage rather than dirt.`,
    },
    {
      question: $localize`:@@faq.home.q2:Can I claim home cleaning against tax?`,
      answer: $localize`:@@faq.home.a2:In Germany a share of household services can be claimed, provided you have a proper invoice and pay by bank transfer rather than cash. We are a registered company with employed, insured staff, so you get an invoice that qualifies. Your tax adviser can tell you the current rate.`,
    },
  ],
};

/** The questions for one service, or an empty list when it has none. */
export const faqsFor = (key: string): readonly Faq[] => SERVICE_FAQS[key] ?? [];
