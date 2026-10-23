import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const buildDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || 'postgresql://postgres:vasumathi@localhost:5432/LIC';

  if (baseUrl.includes('search_path') || baseUrl.includes('options=')) {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}options=-c%20search_path%3DInsurance`;
};

const adapter = new PrismaPg({ connectionString: buildDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@licagent.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@licagent.com',
      mobile: '9999999999',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const lifeCategory = await prisma.category.upsert({
    where: { slug: 'life-insurance' },
    update: {},
    create: {
      name: 'Life Insurance',
      slug: 'life-insurance',
      description: 'Life insurance and protection plans',
    },
  });

  const healthCategory = await prisma.category.upsert({
    where: { slug: 'health-insurance' },
    update: {},
    create: {
      name: 'Health Insurance',
      slug: 'health-insurance',
      description: 'Health and medical coverage',
    },
  });

  const realEstateCategory = await prisma.category.upsert({
    where: { slug: 'real-estate' },
    update: {},
    create: {
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Property and real-estate services',
    },
  });

  const planTypes = [
    ['Endowment Plans','endowment','Savings and protection plans for long-term goals.'],
    ['Money Back Plans','money-back','Plans offering scheduled survival benefits.'],
    ['Whole Life Plans','whole-life','Long-duration lifelong protection plans.'],
    ['Term Plans','term','Pure life protection plans.'],
    ['Annuity Plans','pension','Retirement and regular-income plans.'],
    ['Unit Linked Plans','ulip','Market-linked insurance plans.'],
    ['Child Plans','child','Plans for a child’s education and milestones.'],
  ];
  for (const [name, slug, description] of planTypes) {
    await prisma.insurancePlanType.upsert({ where: { slug }, update: { name, description, categorySlug: 'life-insurance' }, create: { name, slug, description, categorySlug: 'life-insurance' } });
  }

  const healthPlanTypes = [
    ['Individual / Family Health', 'individual-family'],
    ['Specialty / Disease-specific', 'specialty'],
    ['Top-up / Add-on', 'top-up'],
    ['Women / Other Health', 'women-other'],
    ['Accident', 'accident'],
    ['Travel', 'travel'],
  ];
  for (const [name, slug] of healthPlanTypes) {
    await prisma.insurancePlanType.upsert({ where: { slug }, update: { name, categorySlug: 'health-insurance' }, create: { name, slug, categorySlug: 'health-insurance' } });
  }

  // ====== LIFE INSURANCE PRODUCTS ======
  await prisma.product.upsert({
    where: { slug: 'term-assurance-plus' },
    update: {},
    create: {
      name: 'Term Assurance Plus',
      slug: 'term-assurance-plus',
      categoryId: lifeCategory.id,
      provider: 'LIC',
      shortDescription: 'Flexible term plan with high protection coverage.',
      description: 'A robust term insurance option designed for family security and long-term protection.',
      benefits: ['High cover', 'Affordable premiums', 'Tax benefits under Section 80C', 'Flexible policy terms'],
      eligibility: ['Age 18-55', 'Indian resident', 'Non-smoker preferred'],
      coverage: ['Life cover', 'Critical illness add-on', 'Accidental death benefit'],
      premiumInfo: 'Starting from ₹599/year',
      policyTerm: '10 to 40 years',
      documents: ['Identity proof', 'Address proof', 'Age proof', 'Income proof'],
      faq: [
        { question: 'When can I claim?', answer: 'After policy maturity or in case of unfortunate event.' },
        { question: 'What is the minimum cover?', answer: 'Minimum sum assured is ₹10 Lakhs.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.licindia.in/Policies',
      isActive: true,
    },
  });

  // ====== HEALTH INSURANCE PRODUCTS ======
  await prisma.product.upsert({
    where: { slug: 'star-health-insurance' },
    update: {},
    create: {
      name: 'Star Health Insurance',
      slug: 'star-health-insurance',
      categoryId: healthCategory.id,
      provider: 'Star Health Insurance Co.',
      shortDescription: 'Comprehensive medical coverage designed to safeguard your family\'s future.',
      description: 'Protect Your Health. Protect Your Savings. Comprehensive medical coverage with rising healthcare costs, ensure you have the best financial support when you need it most. Access top-tier hospitals without the worry of out-of-pocket expenses.',
      benefits: [
        'Hospitalization Protection - Covers expenses related to room rent, ICU charges, and doctor consultations during inpatient care.',
        'Family Protection - Single policy coverage for your entire family, ensuring everyone gets the care they deserve.',
        'Financial Security - Prevents medical emergencies from draining your savings, providing peace of mind.',
        'Medical Expense Support - Includes pre- and post-hospitalization costs, diagnostics, and treatment procedures.'
      ],
      eligibility: ['Age 18-65', 'Indian resident', 'No pre-existing condition restrictions'],
      coverage: ['Cashless hospitalization', 'Pre & post-hospitalization', 'Ambulance charges', 'Newborn coverage'],
      premiumInfo: 'Starting from ₹2,500/year for individuals',
      policyTerm: '1 to 3 years (renewable)',
      documents: ['ID proof', 'Address proof', 'Age proof'],
      faq: [
        { question: 'What is the waiting period?', answer: '30 days for normal illnesses, 2 years for pre-existing conditions.' },
        { question: 'Can I renew the policy?', answer: 'Yes, policies are renewable lifelong without age limit.' },
        { question: 'What is the tax benefit?', answer: 'Tax benefits available under Section 80D of Income Tax Act.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.starhealth.in',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'family-health-optima' },
    update: {},
    create: {
      name: 'Family Health Optima',
      slug: 'family-health-optima',
      categoryId: healthCategory.id,
      provider: 'LIC',
      shortDescription: 'A comprehensive health policy covering the entire family under one simple insured plan.',
      description: 'Family Health Optima is designed for families seeking comprehensive health coverage. With single policy for the entire family, simplified claims, and extensive network coverage, ensure your loved ones are always protected.',
      benefits: [
        'Restoration of sum insured - Get additional cover after a claim',
        'Coverage for newborn baby - Child born during policy tenure is automatically covered',
        'Domiciliary hospitalization - Treatment at home covered',
        'Mental health coverage - Psychiatric consultation and treatment included'
      ],
      eligibility: ['Age 18-65 for primary member', 'Family size up to 5 members', 'Indian resident'],
      coverage: ['₹5 Lakhs to ₹50 Lakhs sum assured', 'Network hospitals across India', 'Cashless treatment'],
      premiumInfo: 'Starting from ₹4,500/year for family of 4',
      policyTerm: '1 to 5 years',
      documents: ['ID proof', 'Address proof', 'Age proof', 'Family details'],
      faq: [
        { question: 'Can I add more family members later?', answer: 'Yes, subject to insurer\'s underwriting guidelines.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.licindia.in/FamilyHealthOptima',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'young-star-policy' },
    update: {},
    create: {
      name: 'Young Star Policy',
      slug: 'young-star-policy',
      categoryId: healthCategory.id,
      provider: 'Star Health Insurance Co.',
      shortDescription: 'Designed specifically for young individuals and couples below 40 years, offering modern health benefits.',
      description: 'Young Star Policy is crafted for the health-conscious youth. Premium option with no frills, mid-term spouse inclusion, annual health check-ups, and fitness program reimbursement for a healthier tomorrow.',
      benefits: [
        'Premium option for premium health - No waiting periods for selected conditions',
        'Mid-term inclusion of spouse - Add spouse anytime during policy tenure',
        'Annual health check-up - Comprehensive preventive health screening',
        'Fitness program reimbursement - Gym and yoga memberships covered'
      ],
      eligibility: ['Age 18-40', 'Non-smoker', 'Good health status'],
      coverage: ['₹3 Lakhs to ₹10 Lakhs cover', 'Mental health support', 'OPD consultation reimbursement'],
      premiumInfo: 'Starting from ₹1,800/year',
      policyTerm: '1 to 3 years',
      documents: ['ID proof', 'Health declaration form'],
      faq: [
        { question: 'What happens after 40 years?', answer: 'Policy can be converted to regular plan with normal waiting periods.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.starhealth.in/YoungStar',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'senior-citizens-red-carpet' },
    update: {},
    create: {
      name: 'Senior Citizens Red Carpet',
      slug: 'senior-citizens-red-carpet',
      categoryId: healthCategory.id,
      provider: 'LIC',
      shortDescription: 'Specialized health insurance crafted for the elderly aged 60 years and above, with no pre-insurance medical test required.',
      description: 'Senior Citizens Red Carpet is thoughtfully designed for elderly citizens. No medical checkup required, immediate coverage for pre-existing diseases, and outpatient medical expenses—all to ensure golden years are worry-free.',
      benefits: [
        'No pre-policy medical checkup - Simple documentation',
        'Covers pre-existing diseases - Immediate coverage without waiting',
        'Outpatient medical expenses - Doctor visits, medicines, diagnostic tests covered',
        'Home care assistance - Supportive services post-hospitalization'
      ],
      eligibility: ['Age 60+', 'Indian resident', 'No medical checkup needed'],
      coverage: ['₹2 Lakhs to ₹10 Lakhs sum assured', 'Chronic disease management', 'Prescription medicines'],
      premiumInfo: 'Starting from ₹6,000/year',
      policyTerm: '1 to 3 years (renewable)',
      documents: ['ID proof', 'Age proof', 'Address proof'],
      faq: [
        { question: 'Is there an upper age limit?', answer: 'No upper age limit; policies are renewable lifelong.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1576091160683-112943ae4e88?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.licindia.in/SeniorCitizens',
      isActive: true,
    },
  });

  // ====== REAL ESTATE PRODUCTS ======
  await prisma.product.upsert({
    where: { slug: 'azure-residences' },
    update: {},
    create: {
      name: 'The Azure Residences',
      slug: 'azure-residences',
      categoryId: realEstateCategory.id,
      provider: 'Prime Developments Ltd.',
      shortDescription: 'Luxury residential community in the heart of the downtown financial district.',
      description: 'Find the Right Property for Your Future. Navigate the property market with confidence. Whether you are looking for a family home, a strategic commercial investment, or land for future development, our curated portfolio offers unmatched quality and potential.',
      benefits: [
        'Asset Ownership - Build equity through a tangible asset that appreciates over time and provides security against inflation.',
        'Long-Term Investment - Historically proven to deliver significant capital gains over a structured holding period.',
        'Premium Location - Downtown Financial District with excellent connectivity and amenities.'
      ],
      eligibility: ['Age 21+', 'Indian resident', 'Valid ID and income proof'],
      coverage: ['2 & 3 BHK apartments', 'Swimming pool & gym', 'Security & parking', 'Green spaces'],
      premiumInfo: '$1.2M and above',
      policyTerm: 'Freehold ownership',
      documents: ['ID proof', 'Address proof', 'Income proof', 'Bank statements'],
      faq: [
        { question: 'What is the payment plan?', answer: '30% on booking, 40% during construction, 30% on possession.' },
        { question: 'When is possession?', answer: 'Expected possession in 24-30 months from booking.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.azureresidences.example',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'nexus-corporate-hub' },
    update: {},
    create: {
      name: 'Nexus Corporate Hub',
      slug: 'nexus-corporate-hub',
      categoryId: realEstateCategory.id,
      provider: 'Tech Park Developers',
      shortDescription: 'State-of-the-art commercial office space in the tech park avenue.',
      description: 'Premium commercial property designed for forward-thinking businesses. Located in the heart of the tech corridor with world-class infrastructure, connectivity, and business ecosystem. Ideal for startups, established corporations, and co-working spaces.',
      benefits: [
        'Long-Term Investment - Historically proven to deliver significant capital gains and stable rental income.',
        'Property Opportunities & Rental Potential - Unlock dual income streams. Lease to tech companies at premium rates.',
        'High Appreciation - Tech park properties see 8-12% annual appreciation.'
      ],
      eligibility: ['Business entity registration', 'Valid GST/PAN', 'Income proof', 'Business plan'],
      coverage: ['10,000 to 50,000 Sq.Ft. rentable space', 'Premium HVAC system', 'High-speed internet', 'Dedicated parking'],
      premiumInfo: '$4.5M and above',
      policyTerm: 'Leasehold 99 years',
      documents: ['Business registration', 'GST/PAN', 'Bank statements', 'Director ID'],
      faq: [
        { question: 'What is the expected rental yield?', answer: '6-8% annual rental yield guaranteed.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.nexuscorporate.example',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'heritage-valley-estate' },
    update: {},
    create: {
      name: 'Heritage Valley Estate',
      slug: 'heritage-valley-estate',
      categoryId: realEstateCategory.id,
      provider: 'Agricultural Land Trust',
      shortDescription: 'Premium farmland investment in the scenic westside suburbs with agricultural potential.',
      description: 'Strategic agricultural investment opportunity. Located in the westside suburbs with access to water resources and proven agricultural yield. Ideal for investors looking for tangible assets with intrinsic value and long-term appreciation potential.',
      benefits: [
        'Asset Ownership - Own productive agricultural land with historical appreciation.',
        'Long-Term Investment - Agriculture sector provides stable returns through crop cycles.',
        'Diversification - Real estate in agriculture provides portfolio balance.'
      ],
      eligibility: ['Indian citizen', 'Age 21+', 'Valid ID and address proof', 'Agricultural interest'],
      coverage: ['50 to 500 acres of prime farmland', 'Irrigation facilities', 'Market access', 'Legal documentation'],
      premiumInfo: '$850K to $2.5M (per parcel)',
      policyTerm: 'Freehold ownership',
      documents: ['ID proof', 'Address proof', 'Agricultural declaration', 'Bank statements'],
      faq: [
        { question: 'What crops are grown here?', answer: 'Multi-crop farming including vegetables, grains, and cash crops.' },
        { question: 'Is farming support provided?', answer: 'Yes, agricultural extension services and market linkage available.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1500590046916-b5e24b27f75f?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.heritagefarms.example',
      isActive: true,
    },
  });

  // Additional Real Estate Properties
  await prisma.product.upsert({
    where: { slug: 'meadow-garden-estates' },
    update: {},
    create: {
      name: 'Meadow Garden Estates',
      slug: 'meadow-garden-estates',
      categoryId: realEstateCategory.id,
      provider: 'Riverside Constructions',
      shortDescription: 'Gated community with landscaped gardens and modern amenities in the suburbs.',
      description: 'Meadow Garden Estates offers a blend of luxury and nature. Each villa is designed with premium finishes, spacious interiors, and access to common amenities including clubhouse, swimming pool, and jogging tracks.',
      benefits: [
        'Community Living - Gated community with 24/7 security and active social events.',
        'Green Spaces - 40% landscaped gardens and parks within the community.',
        'Investment Potential - High appreciation in premium suburban locations.'
      ],
      eligibility: ['Age 21+', 'Indian resident', 'Valid ID and income proof'],
      coverage: ['3 & 4 BHK villas', 'Community clubhouse', 'Swimming pool', 'Kids play area', 'Jogging track'],
      premiumInfo: '$1.8M - $3.2M per villa',
      policyTerm: 'Freehold',
      documents: ['ID', 'Address proof', 'Income proof'],
      faq: [
        { question: 'Are there maintenance charges?', answer: 'Yes, annual maintenance is approximately $5,000-$8,000.' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7d8a28?auto=format&fit=crop&w=1200&q=80',
      officialUrl: 'https://www.meadowgardens.example',
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'policy-guidance' },
    update: {},
    create: {
      id: 'policy-guidance',
      name: 'Policy Guidance',
      shortDescription: 'Understand which insurance plan suits your financial goals.',
      fullDescription: 'We help compare plans and recommend the most suitable policy for your situation.',
      process: 'Discuss your needs, compare plans, finalize best option',
      documents: ['ID proof', 'Income proof'],
      faq: [{ question: 'Is guidance free?', answer: 'Initial guidance is available through the agent consultation.' }],
      imageUrl: 'https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    },
  });

  await prisma.agentProfile.upsert({
    where: { id: 'agent-profile-default' },
    update: {},
    create: {
      id: 'agent-profile-default',
      name: 'Amit Sharma',
      title: 'Independent LIC Advisor',
      bio: 'Helping families protect their future with personalized insurance and service guidance.',
      experience: '8+ years of advisory experience',
      phone: '+91 98765 43210',
      email: 'amit@licagent.example',
      whatsapp: '+91 98765 43210',
      location: 'Bengaluru, India',
      workingHours: 'Mon-Sat: 9:00 AM - 7:00 PM',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      socialLinks: { linkedin: '#', facebook: '#' },
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
