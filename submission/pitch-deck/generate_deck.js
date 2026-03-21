const pptxgen = require('pptxgenjs');
const { calcTextBox } = require('./pptxgenjs_helpers/text');
const {
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require('./pptxgenjs_helpers/layout');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenAI Codex';
pptx.company = 'EcoSwarm Regen';
pptx.subject = 'Hedera Hello Future Apex Hackathon 2026';
pptx.title = 'EcoSwarm Regen - Apex Sustainability Submission';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
};

const COLORS = {
  forest: '143A2C',
  pine: '214D3B',
  moss: '6E8B60',
  sand: 'F4EFE6',
  stone: 'E6DDCF',
  clay: 'C96F3D',
  amber: 'D8A44B',
  ink: '1C2823',
  white: 'FFFDF8',
  mist: 'F8F6F1',
  line: 'C8BDAA',
};

const TX_IDS = [
  '0.0.8188944-1774108000-409892104',
  '0.0.8188944-1774108013-270156893',
];

const TOKEN_IDS = ['0.0.8316246', '0.0.8316247', '0.0.8316248', '0.0.8316249'];
const TOPIC_ID = '0.0.8316245';
const PUBLIC_URL = 'https://olive-biol-interactions-combination.trycloudflare.com';

function addBackground(slide, color = COLORS.sand) {
  slide.background = { color };
}

function addHeaderRule(slide) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 0.58,
    w: 12.1,
    h: 0,
    line: { color: COLORS.line, pt: 1.2 },
  });
}

function addFooter(slide, label) {
  slide.addText(label, {
    x: 0.7,
    y: 6.85,
    w: 3.5,
    h: 0.22,
    fontFace: 'Aptos',
    fontSize: 10,
    color: COLORS.moss,
    margin: 0,
  });
  slide.addText('EcoSwarm Regen', {
    x: 10.0,
    y: 6.82,
    w: 2.4,
    h: 0.24,
    align: 'right',
    fontFace: 'Aptos',
    fontSize: 10,
    bold: true,
    color: COLORS.forest,
    margin: 0,
  });
}

function addTitle(slide, eyebrow, title, subtitle) {
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.72,
    y: 0.8,
    w: 3.8,
    h: 0.28,
    fontFace: 'Aptos',
    fontSize: 12,
    bold: true,
    color: COLORS.clay,
    margin: 0,
    charSpace: 1.8,
  });

  const titleBox = calcTextBox(24, {
    text: title,
    w: 7.2,
    fontFace: 'Aptos Display',
    fontWeight: 700,
    breakLine: false,
    margin: 0,
    padding: 0,
  });

  slide.addText(title, {
    x: 0.72,
    y: 1.08,
    w: 7.2,
    h: titleBox.h + 0.08,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: COLORS.forest,
    margin: 0,
    breakLine: false,
  });

  const subtitleBox = calcTextBox(12.5, {
    text: subtitle,
    w: 6.4,
    fontFace: 'Aptos',
    margin: 0,
    padding: 0,
    leading: 1.18,
  });

  slide.addText(subtitle, {
    x: 0.74,
    y: 1.96,
    w: 6.4,
    h: subtitleBox.h + 0.05,
    fontFace: 'Aptos',
    fontSize: 12.5,
    color: COLORS.ink,
    margin: 0,
    breakLine: false,
    valign: 'top',
  });
}

function addChip(slide, x, y, w, label, fill, color = COLORS.white) {
  slide.addText(label, {
    x,
    y,
    w,
    h: 0.34,
    align: 'center',
    valign: 'mid',
    fontFace: 'Aptos',
    fontSize: 10.5,
    bold: true,
    color,
    fill: { color: fill },
    line: { color: fill, pt: 0.5 },
    radius: 0.12,
    margin: 0.04,
  });
}

function addBulletList(slide, x, y, w, items, opts = {}) {
  let cursorY = y;
  const fontSize = opts.fontSize || 13;
  for (const item of items) {
    const box = calcTextBox(fontSize, {
      text: item,
      w: w - 0.3,
      fontFace: 'Aptos',
      margin: 0,
      padding: 0,
      leading: 1.15,
    });
    slide.addText(item, {
      x: x + 0.24,
      y: cursorY,
      w: w - 0.24,
      h: box.h + 0.03,
      fontFace: 'Aptos',
      fontSize,
      color: opts.color || COLORS.ink,
      margin: 0,
      bullet: { indent: 14 },
    });
    cursorY += box.h + (opts.gap || 0.12);
  }
}

function addCard(slide, x, y, w, h, title, body, accent = COLORS.forest) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: COLORS.white },
    shadow: { type: 'outer', color: 'C7BBA8', angle: 45, blur: 1, distance: 1, opacity: 0.12 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.12,
    line: { color: accent, pt: 0 },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.22,
    w: w - 0.36,
    h: 0.34,
    fontFace: 'Aptos Display',
    fontSize: 15,
    bold: true,
    color: COLORS.forest,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.6,
    w: w - 0.36,
    h: h - 0.72,
    fontFace: 'Aptos',
    fontSize: 12,
    color: COLORS.ink,
    margin: 0,
    valign: 'top',
  });
}

function finalizeSlide(slide) {
  warnIfSlideHasOverlaps(slide, pptx);
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

function slide1() {
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.forest);

  slide.addShape(pptx.ShapeType.rect, {
    x: 7.7,
    y: 0,
    w: 5.63,
    h: 7.5,
    fill: { color: COLORS.sand },
    line: { color: COLORS.sand, pt: 0 },
  });

  slide.addText('Hedera Apex 2026', {
    x: 0.76,
    y: 0.86,
    w: 2.4,
    h: 0.3,
    fontFace: 'Aptos',
    fontSize: 12,
    bold: true,
    color: COLORS.amber,
    charSpace: 1.4,
    margin: 0,
  });

  slide.addText('EcoSwarm\nRegen', {
    x: 0.72,
    y: 1.34,
    w: 4.8,
    h: 1.55,
    fontFace: 'Aptos Display',
    fontSize: 27,
    bold: true,
    color: COLORS.white,
    breakLine: false,
    margin: 0,
  });

  slide.addText('Verified milestone payouts for community climate projects on Hedera.', {
    x: 0.75,
    y: 3.22,
    w: 5.9,
    h: 0.9,
    fontFace: 'Aptos',
    fontSize: 15,
    color: 'E8EEE8',
    margin: 0,
    breakLine: false,
  });

  addChip(slide, 0.76, 4.4, 2.55, 'Theme 3: Sustainability', COLORS.clay);
  addChip(slide, 3.48, 4.4, 2.15, 'HCS + HTS + A2A', COLORS.pine);

  slide.addText('This is not a dashboard. It is a payout operating system for sponsors, verifiers, and local operators.', {
    x: 0.78,
    y: 5.05,
    w: 6.0,
    h: 0.65,
    fontFace: 'Aptos',
    fontSize: 13,
    color: 'D7E2DA',
    margin: 0,
  });

  slide.addText('Narrow wedge', {
    x: 8.2,
    y: 0.96,
    w: 1.6,
    h: 0.24,
    fontFace: 'Aptos',
    fontSize: 10.5,
    bold: true,
    color: COLORS.clay,
    margin: 0,
  });
  slide.addText('Results-based restoration and resilience funding', {
    x: 8.2,
    y: 1.24,
    w: 4.2,
    h: 0.8,
    fontFace: 'Aptos Display',
    fontSize: 22,
    bold: true,
    color: COLORS.forest,
    margin: 0,
  });

  addCard(slide, 8.18, 2.3, 4.35, 1.1, 'Real Hedera usage', `HCS topic: ${TOPIC_ID}\nHTS tokens: ${TOKEN_IDS.join(', ')}`, COLORS.moss);
  addCard(slide, 8.18, 3.62, 4.35, 1.1, 'Live public demo path', `${PUBLIC_URL}\nA2A card and chat are exposed publicly.`, COLORS.amber);
  addCard(slide, 8.18, 4.94, 4.35, 1.1, 'Operator agent', 'Natural-language case operations, release actions, and machine-to-machine A2A surface.', COLORS.clay);

  addFooter(slide, 'Slide 1');
  finalizeSlide(slide);
}

function slide2() {
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Problem',
    'Climate funding breaks between proof and payout.',
    'Capital often reaches local projects too late because sponsors, verifiers, and operators do not share one trusted workflow.'
  );

  addCard(slide, 0.78, 2.55, 2.88, 2.3, 'Fragmented proof', 'Evidence arrives in documents, chats, spreadsheets, and photo folders that sponsors cannot trust at release time.', COLORS.clay);
  addCard(slide, 3.92, 2.55, 2.88, 2.3, 'Slow sponsor release', 'Funders hold capital longer because each milestone becomes a custom manual review exercise.', COLORS.moss);
  addCard(slide, 7.05, 2.55, 2.88, 2.3, 'Verifier bottlenecks', 'Verifiers operate off-platform, which creates more coordination overhead and less repeatability.', COLORS.amber);
  addCard(slide, 10.18, 2.55, 2.35, 2.3, 'Weak auditability', 'Most products report impact after the fact instead of helping release money with confidence.', COLORS.pine);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 5.32,
    w: 11.72,
    h: 0.9,
    rectRadius: 0.07,
    fill: { color: COLORS.forest },
    line: { color: COLORS.forest, pt: 0 },
  });
  slide.addText('The result is slow funding, fragmented trust, and underfunded local climate action.', {
    x: 1.0,
    y: 5.58,
    w: 11.2,
    h: 0.26,
    fontFace: 'Aptos Display',
    fontSize: 18,
    bold: true,
    color: COLORS.white,
    align: 'center',
    margin: 0,
  });

  addFooter(slide, 'Slide 2');
  finalizeSlide(slide);
}

function slide3() {
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.mist);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Wedge',
    'Start narrow: verified milestone payouts for community climate programs.',
    'The product is designed around one launch wedge instead of a generic sustainability marketplace.'
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.18,
    y: 2.62,
    w: 6.85,
    h: 1.12,
    rectRadius: 0.09,
    fill: { color: COLORS.forest },
    line: { color: COLORS.forest, pt: 0 },
  });
  slide.addText('Field proof -> payout memo -> verifier review -> sponsor authorization -> tranche release', {
    x: 3.45,
    y: 2.99,
    w: 6.3,
    h: 0.26,
    fontFace: 'Aptos',
    fontSize: 15,
    bold: true,
    color: COLORS.white,
    align: 'center',
    margin: 0,
  });

  addCard(slide, 0.86, 4.3, 3.72, 1.62, 'Reforestation', 'Survival checkpoints, field verification, and staggered releases tied to proof completeness.', COLORS.moss);
  addCard(slide, 4.82, 4.3, 3.72, 1.62, 'River cleanup', 'Municipal or CSR funds can release against verified collection, routing, and completion evidence.', COLORS.clay);
  addCard(slide, 8.78, 4.3, 3.72, 1.62, 'Community solar resilience', 'Working capital and follow-on release can be anchored to installation and service milestones.', COLORS.amber);

  addChip(slide, 0.86, 2.62, 1.82, 'Sponsor-ready', COLORS.clay);
  addChip(slide, 0.86, 3.08, 1.82, 'Proof-backed', COLORS.pine);
  addChip(slide, 0.86, 3.54, 1.82, 'Repeatable', COLORS.moss);

  addFooter(slide, 'Slide 3');
  finalizeSlide(slide);
}

function slide4() {
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Product',
    'A finished multi-workspace product, not a one-page demo.',
    'Every page is synchronized around the same payout case and the same Hedera-backed audit line.'
  );

  const items = [
    ['Overview', 'Portfolio, platform signals, and the top release queue.'],
    ['Case Room', 'Shared sponsor, verifier, and operator view for one milestone case.'],
    ['Operations', 'Intake, release recommendations, and treasury actions.'],
    ['Client Portal', 'Sponsor commitments, release alerts, and approval framing.'],
    ['Audit Trail', 'Proof packets, readable event stages, and Hedera checkpoint history.'],
  ];

  items.forEach(([name, body], index) => {
    const x = 0.9 + index * 2.45;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.8,
      w: 2.05,
      h: 2.15,
      rectRadius: 0.06,
      fill: { color: index % 2 === 0 ? COLORS.white : COLORS.mist },
      line: { color: COLORS.line, pt: 1 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: 2.8,
      w: 2.05,
      h: 0.12,
      fill: { color: [COLORS.forest, COLORS.clay, COLORS.moss, COLORS.amber, COLORS.pine][index] },
      line: { color: [COLORS.forest, COLORS.clay, COLORS.moss, COLORS.amber, COLORS.pine][index], pt: 0 },
    });
    slide.addText(name, {
      x: x + 0.14,
      y: 3.08,
      w: 1.74,
      h: 0.32,
      fontFace: 'Aptos Display',
      fontSize: 15,
      bold: true,
      color: COLORS.forest,
      margin: 0,
      align: 'center',
    });
    slide.addText(body, {
      x: x + 0.14,
      y: 3.5,
      w: 1.74,
      h: 1.16,
      fontFace: 'Aptos',
      fontSize: 11.2,
      color: COLORS.ink,
      margin: 0,
      align: 'center',
      valign: 'mid',
    });
    if (index < items.length - 1) {
      slide.addShape(pptx.ShapeType.chevron, {
        x: x + 2.09,
        y: 3.7,
        w: 0.22,
        h: 0.38,
        fill: { color: COLORS.line },
        line: { color: COLORS.line, pt: 0.5 },
      });
    }
  });

  addChip(slide, 0.92, 5.45, 3.05, 'Agent workspace attached to live case state', COLORS.forest);
  addChip(slide, 4.2, 5.45, 3.05, 'Client + operator + verifier stay in sync', COLORS.clay);
  addChip(slide, 7.48, 5.45, 2.6, 'Treasury actions are repeatable', COLORS.moss);
  addChip(slide, 10.3, 5.45, 2.0, 'Audit stays visible', COLORS.amber, COLORS.ink);

  addFooter(slide, 'Slide 4');
  finalizeSlide(slide);
}

function slide5() {
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.mist);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Hedera Fit',
    'Hedera is part of the operating model, not a logo on the last slide.',
    'The workflow depends on many low-cost, ordered, repeatable state changes.'
  );

  addCard(slide, 0.82, 2.52, 2.82, 1.62, 'HCS checkpoints', 'Proof intake, payout memo creation, verification, authorization, and release are all cheap enough to anchor repeatedly.', COLORS.forest);
  addCard(slide, 3.9, 2.52, 2.82, 1.62, 'HTS-linked receipts', 'Impact receipts map financial actions to environmental outcomes instead of stopping at internal status flags.', COLORS.clay);
  addCard(slide, 6.98, 2.52, 2.82, 1.62, 'Low-fee recurrence', 'The business case only works if updates can be frequent, auditable, and financially realistic.', COLORS.moss);
  addCard(slide, 10.06, 2.52, 2.38, 1.62, 'Agent surface', 'A2A endpoints and a public agent card make the operator layer machine-readable.', COLORS.amber);

  slide.addText('Live evidence from this build', {
    x: 0.84,
    y: 4.6,
    w: 2.2,
    h: 0.3,
    fontFace: 'Aptos Display',
    fontSize: 16,
    bold: true,
    color: COLORS.forest,
    margin: 0,
  });

  addCard(slide, 0.82, 4.98, 3.7, 1.28, 'Real HCS transactions', TX_IDS.join('\n'), COLORS.forest);
  addCard(slide, 4.82, 4.98, 3.12, 1.28, 'Live HCS topic', TOPIC_ID, COLORS.clay);
  addCard(slide, 8.24, 4.98, 4.18, 1.28, 'Impact receipt token IDs', TOKEN_IDS.join(', '), COLORS.moss);

  addFooter(slide, 'Slide 5');
  finalizeSlide(slide);
}

function slide6() {
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Demo Proof',
    'One flagship case. One release workflow. One audit line.',
    'Judges should only have to remember a single case moving end to end.'
  );

  const steps = [
    ['1. Proof packet arrives', 'Operator submits a milestone-backed project with proof confidence and counterparties.'],
    ['2. Case Room synchronizes', 'Sponsor, verifier, and operator align around the same release packet and next action.'],
    ['3. Agent dispatch', 'The operator agent explains the case and triggers the next eligible operational step.'],
    ['4. Client release alert', 'Sponsor sees a release-ready case instead of a generic analytics panel.'],
    ['5. Hedera audit trail', 'The workflow ends on visible Hedera-backed proof and treasury checkpoints.'],
  ];

  steps.forEach(([title, body], index) => {
    const y = 2.52 + index * 0.82;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9,
      y,
      w: 0.5,
      h: 0.42,
      rectRadius: 0.08,
      fill: { color: index === 0 ? COLORS.clay : COLORS.forest },
      line: { color: index === 0 ? COLORS.clay : COLORS.forest, pt: 0.5 },
    });
    slide.addText(String(index + 1), {
      x: 1.04,
      y: y + 0.08,
      w: 0.2,
      h: 0.18,
      fontFace: 'Aptos',
      fontSize: 12,
      bold: true,
      color: COLORS.white,
      align: 'center',
      margin: 0,
    });
    slide.addText(title, {
      x: 1.62,
      y: y + 0.02,
      w: 2.8,
      h: 0.2,
      fontFace: 'Aptos Display',
      fontSize: 14,
      bold: true,
      color: COLORS.forest,
      margin: 0,
    });
    slide.addText(body, {
      x: 1.62,
      y: y + 0.28,
      w: 4.8,
      h: 0.28,
      fontFace: 'Aptos',
      fontSize: 11.2,
      color: COLORS.ink,
      margin: 0,
    });
    if (index < steps.length - 1) {
      slide.addShape(pptx.ShapeType.line, {
        x: 1.15,
        y: y + 0.44,
        w: 0,
        h: 0.4,
        line: { color: COLORS.line, pt: 1.2, dash: 'dash' },
      });
    }
  });

  addCard(slide, 7.15, 2.68, 5.1, 1.02, 'What judges should see on screen', 'Overview -> Case Room -> Agent Network -> Blueprint -> Client Portal -> Audit Trail', COLORS.forest);
  addCard(slide, 7.15, 4.0, 5.1, 1.02, 'What judges should hear', '“This release moves only when proof is visible, review is complete, and payout authorization is explicit.”', COLORS.clay);
  addCard(slide, 7.15, 5.32, 5.1, 1.02, 'What judges should remember', 'EcoSwarm removes trust friction from milestone climate payouts instead of adding another reporting dashboard.', COLORS.moss);

  addFooter(slide, 'Slide 6');
  finalizeSlide(slide);
}

function slide7() {
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.mist);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Deployability',
    'This can launch because the buyer, verifier, and operator already exist.',
    'EcoSwarm replaces a broken release workflow instead of inventing a new abstract category.'
  );

  addCard(slide, 0.84, 2.58, 3.72, 2.4, 'Buyer', 'CSR teams\nAdaptation funds\nMunicipal resilience programs\n\nValue: fewer manual release cycles, stronger auditability, and faster confidence to disburse.', COLORS.clay);
  addCard(slide, 4.8, 2.58, 3.72, 2.4, 'Operator', 'NGOs\nCooperatives\nLocal delivery partners\n\nValue: clearer milestone expectations, faster working-capital release, and less sponsor back-and-forth.', COLORS.moss);
  addCard(slide, 8.76, 2.58, 3.72, 2.4, 'Verifier', 'Field auditors\nMRV providers\nEnvironmental review groups\n\nValue: structured review queues, visible proof packets, and repeatable release checkpoints.', COLORS.forest);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.1,
    y: 5.35,
    w: 11.2,
    h: 0.72,
    rectRadius: 0.06,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 1.1 },
  });
  slide.addText('Repeat-use loop: more cases -> more verification checkpoints -> more release actions -> more Hedera writes -> stronger treasury data -> better case ranking.', {
    x: 1.28,
    y: 5.58,
    w: 10.84,
    h: 0.2,
    fontFace: 'Aptos',
    fontSize: 12.2,
    bold: true,
    color: COLORS.ink,
    align: 'center',
    margin: 0,
  });

  addFooter(slide, 'Slide 7');
  finalizeSlide(slide);
}

function slide8() {
  const slide = pptx.addSlide();
  addBackground(slide);
  addHeaderRule(slide);
  addTitle(
    slide,
    'Roadmap',
    'Make the next 90 days concrete.',
    'The project is strongest when pitched as a pilot-ready workflow, not a fully generalized climate platform.'
  );

  addCard(slide, 0.84, 2.78, 5.72, 3.15, 'Next 90 days', '1. Pilot one wedge in one geography.\n2. Add production proof upload and policy checks.\n3. Add sponsor approval and recurring treasury deposit flow.\n4. Onboard one verifier workflow and one operator class.\n5. Keep the agent layer focused on triage, review, and release actions.', COLORS.forest);
  addCard(slide, 6.8, 2.78, 5.72, 3.15, 'Next 6 months', '1. Launch first live funded case.\n2. Add partner reporting and post-release monitoring.\n3. Expand from one wedge to adjacent restoration and resilience programs.\n4. Externalize agent-to-agent handoffs when there is real partner demand.\n5. Turn repeat usage into a measurable Hedera growth story.', COLORS.clay);

  addFooter(slide, 'Slide 8');
  finalizeSlide(slide);
}

function slide9() {
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.forest);

  slide.addText('Incubator Ask', {
    x: 0.82,
    y: 0.92,
    w: 2.4,
    h: 0.26,
    fontFace: 'Aptos',
    fontSize: 12,
    bold: true,
    color: COLORS.amber,
    charSpace: 1.6,
    margin: 0,
  });

  slide.addText('We want one operator, one verifier, and one sponsor class to prove faster trusted payouts for real community climate work.', {
    x: 0.82,
    y: 1.36,
    w: 7.0,
    h: 1.18,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: COLORS.white,
    margin: 0,
    breakLine: false,
  });

  addCard(slide, 0.82, 3.12, 3.68, 1.72, 'What we need', 'Pilot access\nVerifier partnerships\nDesign partners for deployment\n\nThis is now a product-development problem, not an ideation problem.', COLORS.clay);
  addCard(slide, 4.82, 3.12, 3.68, 1.72, 'What we already proved', 'Working multi-page product\nReal Hedera topic + tokens\nPublic A2A agent surface\nLive sponsor / verifier / release workflow', COLORS.moss);
  addCard(slide, 8.82, 3.12, 3.68, 1.72, 'Why now', 'The market already has climate programs, proof friction, and slow release cycles.\nEcoSwarm slots into that gap directly.', COLORS.amber);

  addChip(slide, 0.84, 5.48, 2.7, 'GitHub: Ecoswarm', COLORS.pine);
  addChip(slide, 3.8, 5.48, 4.0, 'Public backend: trycloudflare demo path', COLORS.clay);
  addChip(slide, 8.06, 5.48, 3.28, 'HOL path: code-ready, broker-blocked', COLORS.moss);

  slide.addText('EcoSwarm Regen', {
    x: 0.84,
    y: 6.28,
    w: 2.4,
    h: 0.22,
    fontFace: 'Aptos Display',
    fontSize: 16,
    bold: true,
    color: COLORS.white,
    margin: 0,
  });
  slide.addText('Hedera-native verified milestone payouts for climate programs.', {
    x: 0.84,
    y: 6.56,
    w: 5.4,
    h: 0.22,
    fontFace: 'Aptos',
    fontSize: 11.5,
    color: 'D7E2DA',
    margin: 0,
  });

  addFooter(slide, 'Slide 9');
  finalizeSlide(slide);
}

async function main() {
  slide1();
  slide2();
  slide3();
  slide4();
  slide5();
  slide6();
  slide7();
  slide8();
  slide9();

  await pptx.writeFile({ fileName: 'EcoSwarm-Regen-Apex-Deck.pptx' });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
