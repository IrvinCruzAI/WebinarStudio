import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import { saveAs } from 'file-saver';
import type {
  DeliverableId,
  WR1,
  WR2,
  WR3,
  WR4,
  WR5,
  WR6,
  WR7,
  WR8,
} from '../contracts';

const COLORS = {
  primary: '0891B2',
  secondary: '14B8A6',
  text: '1E293B',
  muted: '64748B',
};

function createTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 48,
        color: COLORS.primary,
      }),
    ],
    spacing: { after: 400 },
  });
}

function createHeading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 300, after: 200 },
  });
}

function createBodyText(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 24,
        color: COLORS.text,
      }),
    ],
    spacing: { after: 200 },
  });
}

function createBulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 24,
        color: COLORS.text,
      }),
    ],
    bullet: { level: 0 },
    spacing: { after: 100 },
  });
}

export async function generateWR1Docx(data: WR1, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Content Summary`),
    new Paragraph({ children: [] }),
  ];

  if (data.parsed_intake.client_name || data.parsed_intake.company) {
    sections.push(createHeading('Client Information', HeadingLevel.HEADING_1));
    if (data.parsed_intake.client_name) {
      sections.push(createBodyText(`Client: ${data.parsed_intake.client_name}`));
    }
    if (data.parsed_intake.company) {
      sections.push(createBodyText(`Company: ${data.parsed_intake.company}`));
    }
    if (data.parsed_intake.speaker_name) {
      sections.push(createBodyText(`Speaker: ${data.parsed_intake.speaker_name}`));
    }
    if (data.parsed_intake.speaker_title) {
      sections.push(createBodyText(`Title: ${data.parsed_intake.speaker_title}`));
    }
    sections.push(new Paragraph({ children: [] }));
  }

  if (data.parsed_intake.webinar_title) {
    sections.push(createHeading('Webinar', HeadingLevel.HEADING_1));
    sections.push(createBodyText(`Title: ${data.parsed_intake.webinar_title}`));
    if (data.parsed_intake.target_audience) {
      sections.push(createBodyText(`Target Audience: ${data.parsed_intake.target_audience}`));
    }
    if (data.parsed_intake.tone) {
      sections.push(createBodyText(`Tone: ${data.parsed_intake.tone}`));
    }
    if (data.parsed_intake.primary_cta_type) {
      sections.push(createBodyText(`Primary CTA: ${data.parsed_intake.primary_cta_type}`));
    }
    sections.push(new Paragraph({ children: [] }));
  }

  if (data.parsed_intake.offer) {
    sections.push(createHeading('Offer', HeadingLevel.HEADING_1));
    sections.push(createBodyText(data.parsed_intake.offer));
    sections.push(new Paragraph({ children: [] }));
  }

  sections.push(createHeading('Main Themes', HeadingLevel.HEADING_1));
  data.main_themes.forEach((theme) => {
    sections.push(createBulletPoint(theme));
  });
  sections.push(new Paragraph({ children: [] }));

  sections.push(createHeading('Speaker Insights', HeadingLevel.HEADING_1));
  data.speaker_insights.forEach((insight) => {
    sections.push(createBulletPoint(insight));
  });
  sections.push(new Paragraph({ children: [] }));

  sections.push(createHeading('Structured Notes', HeadingLevel.HEADING_1));
  data.structured_notes.forEach((note) => {
    sections.push(createBulletPoint(note));
  });
  sections.push(new Paragraph({ children: [] }));

  if (data.proof_points.length > 0) {
    sections.push(createHeading('Proof Points', HeadingLevel.HEADING_1));
    data.proof_points.forEach((proof) => {
      sections.push(createBulletPoint(`[${proof.type.toUpperCase()}] ${proof.content}${proof.source ? ` (Source: ${proof.source})` : ''}`));
    });
    sections.push(new Paragraph({ children: [] }));
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Content_Summary.docx`);
}

export async function generateWR2Docx(data: WR2, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Framework`),
    createBodyText('21-Block Presentation Structure'),
    new Paragraph({ children: [] }),
  ];

  const phases = ['beginning', 'middle', 'end'] as const;
  const phaseLabels = {
    beginning: 'Beginning (Blocks 1-7)',
    middle: 'Middle (Blocks 8-14)',
    end: 'End (Blocks 15-21)',
  };

  for (const phase of phases) {
    const phaseBlocks = data.blocks.filter((b) => b.phase === phase);
    sections.push(createHeading(phaseLabels[phase], HeadingLevel.HEADING_1));

    for (const block of phaseBlocks) {
      sections.push(createHeading(`${block.block_id}: ${block.title}`, HeadingLevel.HEADING_2));
      sections.push(createBodyText(`Purpose: ${block.purpose}`));
      sections.push(createBodyText(`Duration: ${block.timebox_minutes} minutes`));
      sections.push(new Paragraph({ children: [] }));
      sections.push(createBodyText('Talk Track:'));
      sections.push(createBodyText(block.talk_track_md));
      sections.push(new Paragraph({ children: [] }));
      sections.push(createBodyText('Speaker Notes:'));
      sections.push(createBodyText(block.speaker_notes_md));

      if (block.transition_in) {
        sections.push(createBodyText(`Transition In: ${block.transition_in}`));
      }
      if (block.transition_out) {
        sections.push(createBodyText(`Transition Out: ${block.transition_out}`));
      }

      if (block.objections_handled.length > 0) {
        sections.push(createBodyText('Objections Handled:'));
        block.objections_handled.forEach((obj) => {
          sections.push(createBulletPoint(obj));
        });
      }

      sections.push(new Paragraph({ children: [] }));
    }
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Framework.docx`);
}

export async function generateWR3Docx(data: WR3, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Landing Page`),
    new Paragraph({ children: [] }),
    createHeading('Hero Section', HeadingLevel.HEADING_1),
    createHeading(data.hero_headline, HeadingLevel.HEADING_2),
    createBodyText(data.subheadline),
    new Paragraph({ children: [] }),
    createHeading('Key Benefits', HeadingLevel.HEADING_1),
  ];

  data.bullets.forEach((bullet) => {
    sections.push(createBulletPoint(bullet));
  });

  sections.push(new Paragraph({ children: [] }));
  sections.push(createHeading('Agenda Preview', HeadingLevel.HEADING_1));
  data.agenda_preview.forEach((item) => {
    sections.push(createBulletPoint(`${item.segment} (${item.timebox_minutes} min) - ${item.promise}`));
  });

  sections.push(new Paragraph({ children: [] }));
  sections.push(createHeading('Proof & Social Proof', HeadingLevel.HEADING_1));
  data.proof_blocks.forEach((proof) => {
    sections.push(createBulletPoint(`[${proof.type.toUpperCase()}] ${proof.content}${proof.needs_source ? ' (needs source)' : ''}`));
  });

  sections.push(new Paragraph({ children: [] }));
  sections.push(createHeading('Who This Is For', HeadingLevel.HEADING_1));
  data.who_its_for.forEach((item) => {
    sections.push(createBulletPoint(item));
  });

  sections.push(new Paragraph({ children: [] }));
  sections.push(createHeading('Who This Is NOT For', HeadingLevel.HEADING_1));
  data.who_its_not_for.forEach((item) => {
    sections.push(createBulletPoint(item));
  });

  sections.push(new Paragraph({ children: [] }));
  sections.push(createHeading('Speaker Bio', HeadingLevel.HEADING_1));
  sections.push(createBodyText(data.speaker_bio.one_liner));
  sections.push(createBodyText('Credibility:'));
  data.speaker_bio.credibility_bullets.forEach((bullet) => {
    sections.push(createBulletPoint(bullet));
  });

  sections.push(new Paragraph({ children: [] }));
  sections.push(createHeading('Call to Action', HeadingLevel.HEADING_1));
  sections.push(createBodyText(`Headline: ${data.cta_block.headline}`));
  sections.push(createBodyText(data.cta_block.body));
  sections.push(createBodyText(`Button: ${data.cta_block.button_label}`));
  sections.push(createBodyText(`Link: ${data.cta_block.link_placeholder}`));

  if (data.faq.length > 0) {
    sections.push(new Paragraph({ children: [] }));
    sections.push(createHeading('FAQ', HeadingLevel.HEADING_1));
    data.faq.forEach((item) => {
      sections.push(createHeading(item.question, HeadingLevel.HEADING_2));
      sections.push(createBodyText(item.answer));
    });
  }

  if (data.legal_disclaimer_md) {
    sections.push(new Paragraph({ children: [] }));
    sections.push(createHeading('Legal Disclaimer', HeadingLevel.HEADING_1));
    sections.push(createBodyText(data.legal_disclaimer_md));
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Landing_Page.docx`);
}

export async function generateWR4Docx(data: WR4, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Email Campaign Copy`),
    new Paragraph({ children: [] }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Paste this email copy into your email platform (Mailchimp, ConvertKit, ActiveCampaign, etc). Configure sender information and button links in your email tool.',
          size: 22,
          color: COLORS.muted,
          italics: true,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  data.emails.forEach((email, index) => {
    sections.push(createHeading(`Email ${index + 1}: ${email.email_id}`, HeadingLevel.HEADING_1));
    sections.push(createBodyText(`Timing: ${email.timing}`));
    sections.push(new Paragraph({ children: [] }));
    sections.push(createHeading('Subject Line', HeadingLevel.HEADING_2));
    sections.push(createBodyText(email.subject));
    sections.push(createHeading('Preview Text', HeadingLevel.HEADING_2));
    sections.push(createBodyText(email.preview_text));
    sections.push(createHeading('Body', HeadingLevel.HEADING_2));
    sections.push(createBodyText(email.body_markdown));
    sections.push(createHeading('CTA Button Label', HeadingLevel.HEADING_2));
    sections.push(createBodyText(email.primary_cta_label));
    sections.push(new Paragraph({ children: [] }));
  });

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Emails.docx`);
}

export async function generateWR5Docx(data: WR5, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Social Media`),
    new Paragraph({ children: [] }),
    createHeading('LinkedIn Posts', HeadingLevel.HEADING_1),
  ];

  data.linkedin_posts.forEach((post, index) => {
    sections.push(createHeading(`LinkedIn ${index + 1}: ${post.social_id}`, HeadingLevel.HEADING_2));
    sections.push(createBodyText(`Hook: ${post.hook}`));
    sections.push(createBodyText(post.body));
    sections.push(createBodyText(`CTA: ${post.cta_line}`));
    sections.push(new Paragraph({ children: [] }));
  });

  sections.push(createHeading('X (Twitter) Posts', HeadingLevel.HEADING_1));
  data.x_posts.forEach((post, index) => {
    sections.push(createHeading(`X Post ${index + 1}: ${post.social_id}`, HeadingLevel.HEADING_2));
    sections.push(createBodyText(post.body));
    sections.push(new Paragraph({ children: [] }));
  });

  sections.push(createHeading('Last Chance Blurbs', HeadingLevel.HEADING_1));
  data.last_chance_blurbs.forEach((post, index) => {
    sections.push(createHeading(`Last Chance ${index + 1}: ${post.social_id}`, HeadingLevel.HEADING_2));
    sections.push(createBodyText(post.body));
    sections.push(new Paragraph({ children: [] }));
  });

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Social_Media.docx`);
}

export async function generateWR6Docx(data: WR6, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Run of Show`),
    createBodyText(`Total Duration: ${data.total_duration_minutes} minutes`),
    new Paragraph({ children: [] }),
  ];

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Time')], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph('Block')], width: { size: 10, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph('Segment')], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph('Speaker Notes')], width: { size: 50, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  data.timeline.forEach((segment) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(`${segment.start_minute}-${segment.end_minute}m`)],
          }),
          new TableCell({
            children: [new Paragraph(segment.block_id)],
          }),
          new TableCell({
            children: [new Paragraph(segment.segment_title)],
          }),
          new TableCell({
            children: [new Paragraph(segment.description)],
          }),
        ],
      })
    );
  });

  sections.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Run_of_Show.docx`);
}

export async function generateWR7Docx(data: WR7, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Checklist`),
    new Paragraph({ children: [] }),
  ];

  const checklistSections = [
    { title: 'Pre-Webinar', items: data.pre_webinar },
    { title: 'Live Webinar', items: data.live_webinar },
    { title: 'Post-Webinar', items: data.post_webinar },
  ];

  checklistSections.forEach(({ title, items }) => {
    sections.push(createHeading(title, HeadingLevel.HEADING_1));
    items.forEach((item) => {
      sections.push(createBulletPoint(`[${item.timing}] ${item.task}`));
      if (item.notes) {
        sections.push(createBodyText(`   Notes: ${item.notes}`));
      }
    });
    sections.push(new Paragraph({ children: [] }));
  });

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Checklist.docx`);
}

export async function generateWR8Docx(data: WR8, projectTitle: string): Promise<void> {
  const sections: Paragraph[] = [
    createTitle(`${projectTitle} - Slide Deck Brief`),
    new Paragraph({ children: [] }),
    createHeading('Visual Direction', HeadingLevel.HEADING_1),
    createBodyText(data.visual_direction),
    new Paragraph({ children: [] }),
    createBodyText(`Recommended Slide Count: ${data.slide_count_recommendation}`),
    new Paragraph({ children: [] }),
    createHeading('Gamma AI Prompt', HeadingLevel.HEADING_1),
    createBodyText(data.gamma_prompt),
    new Paragraph({ children: [] }),
  ];

  if (data.key_slides.length > 0) {
    sections.push(createHeading('Key Slides', HeadingLevel.HEADING_1));
    data.key_slides.forEach((slide) => {
      sections.push(createHeading(`Slide ${slide.slide_number}: ${slide.title}`, HeadingLevel.HEADING_2));
      sections.push(createBodyText(`Purpose: ${slide.purpose}`));
      sections.push(createBodyText('Content Points:'));
      slide.content_points.forEach((point) => {
        sections.push(createBulletPoint(point));
      });
      sections.push(new Paragraph({ children: [] }));
    });
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Slide_Deck.docx`);
}

export async function generateDocx(
  deliverableId: DeliverableId,
  content: unknown,
  projectTitle: string
): Promise<void> {
  switch (deliverableId) {
    case 'WR1':
      return generateWR1Docx(content as WR1, projectTitle);
    case 'WR2':
      return generateWR2Docx(content as WR2, projectTitle);
    case 'WR3':
      return generateWR3Docx(content as WR3, projectTitle);
    case 'WR4':
      return generateWR4Docx(content as WR4, projectTitle);
    case 'WR5':
      return generateWR5Docx(content as WR5, projectTitle);
    case 'WR6':
      return generateWR6Docx(content as WR6, projectTitle);
    case 'WR7':
      return generateWR7Docx(content as WR7, projectTitle);
    case 'WR8':
      return generateWR8Docx(content as WR8, projectTitle);
    default:
      throw new Error(`DOCX export not supported for ${deliverableId}`);
  }
}
