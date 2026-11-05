const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const entries = [
  {
    name: "মুহাম্মাদ খালিদ বিন সিদ্দিক",
    committedAmount: 200,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 200 }],
  },
  {
    name: "মুহাম্মাদ আল আমিন (বন্ধু)",
    committedAmount: 0,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ মাহমুদ হোসেন নাহিয়ান",
    committedAmount: 200,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ নূরুল হুদা",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ আবু বকর সিদ্দিক",
    committedAmount: 1000,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 1000 }],
  },
  {
    name: "এস. এম. তাওহীদুল হাসান",
    committedAmount: 100,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 100 }],
    existingPhone: "01963250595",
  },
  {
    name: "মুশতাক আহমাদ",
    committedAmount: 0,
    contributions: [],
  },
  {
    name: "এস. এম. খালিদ হাসান",
    committedAmount: 100,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 100 }],
    existingPhone: "01918780947",
  },
  {
    name: "মুহাম্মাদ আব্দুল আলিম",
    committedAmount: 200,
    contributions: [],
    existingPhone: "০১৫২১৪৫৫০০৭",
  },
  {
    name: "মুহাম্মাদ আব্দুল্লাহ আল মাহদী",
    committedAmount: 200,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ তৈমুর রহমান",
    committedAmount: 100,
    contributions: [
      { monthYear: "অক্টোবর-২৬", amount: 100 },
      { monthYear: "নভেম্বর-২৬", amount: 100 },
      { monthYear: "ডিসেম্বর-২৬", amount: 100 },
      { monthYear: "জানুয়ারি-২৭", amount: 100 },
      { monthYear: "ফেব্রুয়ারি-২৭", amount: 100 },
    ],
  },
  {
    name: "জুনাইদ হাসান",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ আল আমিন",
    committedAmount: 100,
    contributions: [],
    existingPhone: "01516545553",
  },
  {
    name: "মুহাম্মাদ নাইম বিন ইব্রাহিম",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ নাহিদ হোসেন",
    committedAmount: 200,
    contributions: [
      { monthYear: "অক্টোবর-২৬", amount: 200 },
      { monthYear: "নভেম্বর-২৬", amount: 200 },
    ],
  },
  {
    name: "মুহাম্মাদ নাইম হাসান",
    committedAmount: 0,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ নোমান",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ ফয়জুর রহমান",
    committedAmount: 500,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ আবির হোসেন",
    committedAmount: 200,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 200 }],
  },
  {
    name: "মুহাম্মাদ ইউসুফ",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ কারিমুল ইসলাম",
    committedAmount: 200,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 200 }],
  },
  {
    name: "মুহাম্মাদ রেজাউল করিম",
    committedAmount: 300,
    contributions: [{ monthYear: "অক্টোবর-২৬", amount: 300 }],
    existingPhone: "01833184302",
  },
  {
    name: "মুহাম্মাদ হাবিবুল্লাহ বেলালী",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ আজিম বিল্লাহ",
    committedAmount: 100,
    contributions: [],
    userType: "WELL_WISHER",
  },
  {
    name: "মুহাম্মাদ জাহিদুল ইসলাম",
    committedAmount: 100,
    contributions: [],
  },
  {
    name: "মুহাম্মাদ সাইফুজ্জামান",
    committedAmount: 100,
    contributions: [
      { monthYear: "অক্টোবর-২৬", amount: 100 },
      { monthYear: "নভেম্বর-২৬", amount: 100 },
    ],
    userType: "WELL_WISHER",
  },
];

async function main() {
  const fund = await prisma.fund.findFirst({
    where: { slug: "sadakah-zariyah-friend-welfare-fund" },
  });

  if (!fund) {
    throw new Error("Fund not found!");
  }

  const superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  const dummyHash = await bcrypt.hash("OfflineAccount123!", 10);

  console.log(`Starting import for fund: "${fund.title}" (${fund.id})`);

  let totalImportedPayments = 0;
  let offlineUserCounter = 1;

  for (const entry of entries) {
    let user = null;

    // 1. Check if user already exists by phone
    if (entry.existingPhone) {
      user = await prisma.user.findUnique({
        where: { phone: entry.existingPhone },
      });
    }

    // 2. If not found by phone, try finding by exact name
    if (!user) {
      user = await prisma.user.findFirst({
        where: { name: entry.name },
      });
    }

    // 3. If still not found, create an offline placeholder user
    if (!user) {
      const pseudoPhone = `offline_${String(offlineUserCounter).padStart(3, "0")}_${Date.now().toString().slice(-4)}`;
      offlineUserCounter++;

      user = await prisma.user.create({
        data: {
          name: entry.name,
          phone: pseudoPhone,
          passwordHash: dummyHash,
          batchYear: 2012,
          role: "MEMBER",
          userType: entry.userType || "BATCH_MEMBER",
          isActive: true,
          isClaimed: false,
          showPhoneInDirectory: false,
        },
      });
      console.log(`Created offline member: ${user.name} (${user.id})`);
    } else {
      console.log(`Found existing member: ${user.name} (${user.id})`);
    }

    // 4. Update or create commitment if committedAmount > 0
    if (entry.committedAmount > 0) {
      await prisma.fundCommitment.upsert({
        where: {
          fundId_userId: {
            fundId: fund.id,
            userId: user.id,
          },
        },
        create: {
          fundId: fund.id,
          userId: user.id,
          committedAmount: entry.committedAmount,
          startMonth: "অক্টোবর-২৬",
          status: "ACTIVE",
        },
        update: {
          committedAmount: entry.committedAmount,
          status: "ACTIVE",
        },
      });
    }

    // 5. Create or verify contributions
    for (const contrib of entry.contributions) {
      const existing = await prisma.monthlyContribution.findFirst({
        where: {
          fundId: fund.id,
          userId: user.id,
          monthYear: contrib.monthYear,
        },
      });

      if (!existing) {
        await prisma.monthlyContribution.create({
          data: {
            fundId: fund.id,
            userId: user.id,
            monthYear: contrib.monthYear,
            amountPaid: contrib.amount,
            paymentMethod: "BKASH",
            status: "VERIFIED",
            verifiedByUserId: superAdmin?.id,
            verifiedAt: new Date("2026-11-04T12:00:00.000Z"),
            note: "প্রাথমিক শিট থেকে সংরক্ষিত অফিশিয়াল এন্ট্রি",
          },
        });
        totalImportedPayments += contrib.amount;
        console.log(`  + Added contribution: ${contrib.monthYear} - ${contrib.amount} Tk`);
      } else {
        // Ensure status is VERIFIED
        if (existing.status !== "VERIFIED") {
          await prisma.monthlyContribution.update({
            where: { id: existing.id },
            data: { status: "VERIFIED", verifiedAt: new Date() },
          });
        }
        totalImportedPayments += Number(existing.amountPaid);
        console.log(`  ✓ Existing contribution: ${contrib.monthYear} - ${existing.amountPaid} Tk`);
      }
    }
  }

  // 6. Update fund currentBalance
  const allVerified = await prisma.monthlyContribution.aggregate({
    where: { fundId: fund.id, status: "VERIFIED" },
    _sum: { amountPaid: true },
  });

  const verifiedTotal = Number(allVerified._sum.amountPaid || 0);

  await prisma.fund.update({
    where: { id: fund.id },
    data: { currentBalance: verifiedTotal },
  });

  console.log(`\n========================================`);
  console.log(`SUCCESS! Fund balance updated to: ${verifiedTotal} Tk`);
  console.log(`Expected target from sheet: 3200 Tk`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
