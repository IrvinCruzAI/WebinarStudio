export const processingSteps = [
  {
    id: 'WR1',
    name: 'Normalize & Clean',
    description: 'Clean transcript and extract structured notes',
  },
  {
    id: 'WR2',
    name: 'Content Summary',
    description: 'Generate key takeaways, outline, and angles',
  },
  {
    id: 'WR3',
    name: 'Run-of-Show',
    description: 'Create webinar agenda with timestamps and CTAs',
  },
  {
    id: 'WR4',
    name: 'Copy Pack',
    description: 'Landing page, emails, and social content',
  },
  {
    id: 'WR5',
    name: 'Checklist',
    description: 'Pre, during, and post webinar tasks',
  },
];

export const deliverables = [
  {
    id: 'content_summary',
    name: 'Content Summary & Strategy',
    stepId: 'WR2',
    description: 'Key takeaways, session outline, and recommended marketing angles',
    icon: 'FileText',
    color: 'blue',
  },
  {
    id: 'landing_page',
    name: 'Landing Page Copy',
    stepId: 'WR4',
    subSection: 'landing_page',
    description: 'Headlines, hero copy, benefits, FAQs, and CTAs',
    icon: 'Layout',
    color: 'purple',
  },
  {
    id: 'email_campaign',
    name: 'Email Campaign',
    stepId: 'WR4',
    subSection: 'email_campaign',
    description: '6-email nurture sequence with subject lines and bodies',
    icon: 'Mail',
    color: 'indigo',
  },
  {
    id: 'social_media',
    name: 'Social Media Posts',
    stepId: 'WR4',
    subSection: 'social_promo',
    description: 'LinkedIn, X/Twitter posts, and last-chance messages',
    icon: 'Share2',
    color: 'cyan',
  },
  {
    id: 'run_of_show',
    name: 'Run-of-Show',
    stepId: 'WR3',
    description: 'Minute-by-minute webinar agenda with speaker notes and transitions',
    icon: 'Clock',
    color: 'teal',
  },
  {
    id: 'checklist',
    name: 'Execution Checklist',
    stepId: 'WR5',
    description: 'Pre-webinar, live event, and post-webinar action items',
    icon: 'CheckSquare',
    color: 'green',
  },
];

