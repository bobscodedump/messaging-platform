/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    const demoCompanyId = 'cmeic3bb30000oh3wub0sckq3';
    const demoUserId = 'user-demo-1';

    // Upsert company
    const company = await prisma.company.upsert({
      where: { id: demoCompanyId },
      update: { name: 'Demo Co' },
      create: {
        id: demoCompanyId,
        name: 'Demo Co',
        whatsappPhone: null,
        whatsappApiKey: null,
        whatsappApiUrl: null,
      },
    });

    // Upsert user under that company
    const passwordHash = await bcrypt.hash('demo-password', 10);
    const user = await prisma.user.upsert({
      where: { id: demoUserId },
      update: { firstName: 'Demo', lastName: 'User', email: 'demo@example.com', role: 'COMPANY_ADMIN' },
      create: {
        id: demoUserId,
        companyId: company.id,
        email: 'demo@example.com',
        passwordHash,
        firstName: 'Demo',
        lastName: 'User',
        role: 'COMPANY_ADMIN',
      },
    });

    console.log('Seed base:', { company: company.id, user: user.id });
    // Seed contacts (all with the same phone number for testing)
    const TEST_PHONE = '+65 96964653';
    const contacts = [
      {
        id: 'contact-demo-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phoneNumber: TEST_PHONE,
        email: 'ada@example.com',
        birthDate: new Date('1990-12-10'),
      },
      {
        id: 'contact-demo-2',
        firstName: 'Grace',
        lastName: 'Hopper',
        phoneNumber: TEST_PHONE,
        email: 'grace@example.com',
        birthDate: new Date('1985-05-09'),
      },
      {
        id: 'contact-demo-3',
        firstName: 'Alan',
        lastName: 'Turing',
        phoneNumber: TEST_PHONE,
        email: 'alan@example.com',
        birthDate: new Date('1992-06-23'),
      },
      {
        id: 'contact-demo-4',
        firstName: 'Katherine',
        lastName: 'Johnson',
        phoneNumber: TEST_PHONE,
        email: 'katherine@example.com',
        birthDate: null,
      },
      {
        id: 'contact-demo-5',
        firstName: 'Margaret',
        lastName: 'Hamilton',
        phoneNumber: TEST_PHONE,
        email: 'margaret@example.com',
        birthDate: null,
      },
    ];
    for (const c of contacts) {
      await prisma.contact.upsert({
        where: { id: c.id },
        update: {
          firstName: c.firstName,
          lastName: c.lastName,
          phoneNumber: c.phoneNumber,
          email: c.email,
          birthDate: c.birthDate,
        },
        create: {
          id: c.id,
          companyId: company.id,
          firstName: c.firstName,
          lastName: c.lastName,
          phoneNumber: c.phoneNumber,
          email: c.email,
          birthDate: c.birthDate,
        },
      });
    }
    console.log('Seeded contacts:', contacts.length);

    // Seed groups
    const groups = [
      { id: 'group-demo-1', name: 'VIP', description: 'VIP customers' },
      { id: 'group-demo-2', name: 'Staff', description: 'Internal staff' },
      { id: 'group-demo-3', name: 'All', description: 'All contacts' },
    ];
    for (const g of groups) {
      await prisma.group.upsert({
        where: { id: g.id },
        update: { name: g.name, description: g.description },
        create: { id: g.id, companyId: company.id, name: g.name, description: g.description },
      });
    }
    console.log('Seeded groups:', groups.length);

    // Seed group memberships
    const vipMembers = ['contact-demo-1', 'contact-demo-2'];
    const staffMembers = ['contact-demo-3', 'contact-demo-4'];
    const allMembers = contacts.map((c) => c.id);
    const memberships = [
      ...vipMembers.map((cid) => ({ groupId: 'group-demo-1', contactId: cid })),
      ...staffMembers.map((cid) => ({ groupId: 'group-demo-2', contactId: cid })),
      ...allMembers.map((cid) => ({ groupId: 'group-demo-3', contactId: cid })),
    ];
    // createMany with skipDuplicates respects the unique (groupId, contactId)
    await prisma.groupMember.createMany({ data: memberships, skipDuplicates: true });
    console.log('Seeded group memberships:', memberships.length);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
