import { PrismaClient, Role, PaymentMethod, PaymentStatus, CommitmentStatus, NoticeCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding for Dakhil 2012 Batch...");

  // Clear existing data gracefully
  await prisma.activityLog.deleteMany({});
  await prisma.fundExpense.deleteMany({});
  await prisma.monthlyContribution.deleteMany({});
  await prisma.fundCommitment.deleteMany({});
  await prisma.fundManager.deleteMany({});
  await prisma.fund.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.siteSetting.deleteMany({});
  await prisma.galleryItem.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 1. Create Super Admin
  const admin = await prisma.user.create({
    data: {
      name: "মাওলানা তানভীর আহমেদ",
      email: "admin@dakhil2012.com",
      phone: "01711000001",
      passwordHash: defaultPassword,
      role: Role.SUPER_ADMIN,
      bio: "দাখিল ২০১২ ব্যাচ সমন্বয়ক, খুলনা আলিয়া মাদ্রাসা। ব্যাচের ঐক্য ও বন্ধু কল্যাণ কার্যক্রমে নিবেদিত।",
      bloodGroup: "B+",
      occupation: "সফটওয়্যার ইঞ্জিনিয়ার ও শিক্ষক",
      workplace: "টেক সলিউশন্স বিডি, খুলনা",
      presentAddress: "সোনাডাঙ্গা, খুলনা",
      permanentAddress: "রূপসা, খুলনা",
      showPhoneInDirectory: true,
      showEmailInDirectory: true,
      isActive: true,
    },
  });

  // 2. Create Fund Managers
  const manager1 = await prisma.user.create({
    data: {
      name: "মুহাম্মাদ রেজওয়ানুল হক",
      email: "rezwan@dakhil2012.com",
      phone: "01711000002",
      passwordHash: defaultPassword,
      role: Role.FUND_MANAGER,
      bio: "হিসাব ও তহবিল পরিচালক, ইসলামী অর্থনীতি ও ব্যাংকিং পেশাজীবী।",
      bloodGroup: "O+",
      occupation: "অ্যাসিস্ট্যান্ট ভাইস প্রেসিডেন্ট, ইসলামী ব্যাংক",
      workplace: "ইসলামী ব্যাংক বাংলাদেশ লিমিটেড",
      presentAddress: "বয়রা, খুলনা",
      permanentAddress: "দিঘলিয়া, খুলনা",
      showPhoneInDirectory: true,
      showEmailInDirectory: true,
      isActive: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "হাফেজ মাওলানা মাহমুদ হাসান",
      email: "mahmud@dakhil2012.com",
      phone: "01711000003",
      passwordHash: defaultPassword,
      role: Role.FUND_MANAGER,
      bio: "কল্যাণ তহবিল আহ্বায়ক ও ধর্মীয় বক্তা।",
      bloodGroup: "A+",
      occupation: "ব্যবসায়ী ও খতিব",
      workplace: "আল-ফালাহ এন্টারপ্রাইজ",
      presentAddress: "খালিশপুর, খুলনা",
      permanentAddress: "ফুলতলা, খুলনা",
      showPhoneInDirectory: true,
      showEmailInDirectory: true,
      isActive: true,
    },
  });

  // 3. Create General Members
  const membersData = [
    {
      name: "ডা. সাকিব আল হাসান",
      email: "sakib@dakhil2012.com",
      phone: "01711000004",
      bio: "চিকিৎসাসেবায় নিয়োজিত ও সমাজসেবায় আগ্রহী।",
      bloodGroup: "AB+",
      occupation: "মেডিকেল অফিসার",
      workplace: "খুলনা মেডিকেল কলেজ হাসপাতাল",
      presentAddress: "কেডিএ অ্যাভিনিউ, খুলনা",
      permanentAddress: "বটিয়াঘাটা, খুলনা",
    },
    {
      name: "ইঞ্জিনিয়ার খালিদ সাইফুল্লাহ",
      email: "khalid@dakhil2012.com",
      phone: "01711000005",
      bio: "কনস্ট্রাকশন ও সিভিল ইঞ্জিনিয়ারিং প্রজেক্ট ম্যানেজার।",
      bloodGroup: "B+",
      occupation: "প্রজেক্ট ইঞ্জিনিয়ার",
      workplace: "ন্যাশনাল হাউজিং লিমিটেড",
      presentAddress: "মিরপুর, ঢাকা",
      permanentAddress: "দাকোপ, খুলনা",
    },
    {
      name: "মুহাম্মাদ জুবায়ের আহমেদ",
      email: "zubair@dakhil2012.com",
      phone: "01711000006",
      bio: "ই-কমার্স উদ্যোক্তা ও ডিজিটাল মার্কেটিং কনসালট্যান্ট।",
      bloodGroup: "O+",
      occupation: "আইটি উদ্যোক্তা",
      workplace: "আইটি ভিশন ল্যাব",
      presentAddress: "নিরালা, খুলনা",
      permanentAddress: "পাইকগাছা, খুলনা",
    },
    {
      name: "মাওলানা নাঈমুল ইসলাম",
      email: "naim@dakhil2012.com",
      phone: "01711000007",
      bio: "মুহাদ্দিস ও শরিয়াহ গবেষক।",
      bloodGroup: "O-",
      occupation: "মুহাদ্দিস ও শিক্ষক",
      workplace: "দারুল উলুম মাদ্রাসা",
      presentAddress: "দৌলতপুর, খুলনা",
      permanentAddress: "তেরখাদা, খুলনা",
    },
    {
      name: "মুহাম্মাদ আরিফুর রহমান",
      email: "arif@dakhil2012.com",
      phone: "01711000008",
      bio: "কর ও হিসাব নিরীক্ষক।",
      bloodGroup: "A-",
      occupation: "চার্টার্ড অ্যাকাউন্ট্যান্ট শিক্ষার্থী",
      workplace: "রহমান অ্যান্ড কোং",
      presentAddress: "শান্তিনগর, ঢাকা",
      permanentAddress: "কয়রা, খুলনা",
    },
    {
      name: "মুহাম্মাদ হাসিবুর রহমান",
      email: "hasib@dakhil2012.com",
      phone: "01711000009",
      bio: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের সহকারী সচিব পদমর্যাদা।",
      bloodGroup: "B-",
      occupation: "বিসিএস প্রশাসন কর্মকর্তা",
      workplace: "জনপ্রশাসন মন্ত্রণালয়, ঢাকা",
      presentAddress: "ধানমন্ডি, ঢাকা",
      permanentAddress: "রূপসা, খুলনা",
    },
    {
      name: "মুহাম্মাদ তারিকুল ইসলাম",
      email: "tarikul@dakhil2012.com",
      phone: "01711000010",
      bio: "কৃষি উদ্যোক্তা ও গবেষক।",
      bloodGroup: "A+",
      occupation: "কৃষিবিদ ও খামারি",
      workplace: "গ্রিন অ্যাগ্রো ফার্ম",
      presentAddress: "ফুলতলা, খুলনা",
      permanentAddress: "ফুলতলা, খুলনা",
    },
  ];

  const createdMembers = [];
  for (const m of membersData) {
    const user = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        phone: m.phone,
        passwordHash: defaultPassword,
        role: Role.MEMBER,
        bio: m.bio,
        bloodGroup: m.bloodGroup,
        occupation: m.occupation,
        workplace: m.workplace,
        presentAddress: m.presentAddress,
        permanentAddress: m.permanentAddress,
        showPhoneInDirectory: true,
        showEmailInDirectory: true,
        isActive: true,
      },
    });
    createdMembers.push(user);
  }

  // 4. Create Funds
  const fund1 = await prisma.fund.create({
    data: {
      title: "সদকায়ে যারিয়াহ ও বন্ধু কল্যাণ ফান্ড",
      slug: "sadqah-welfare-fund",
      description: "ব্যাচের অসচ্ছল বন্ধুদের দীর্ঘমেয়াদী কর্মসংস্থান, শিক্ষা ও সদকায়ে যারিয়াহমূলক সামাজিক উন্নয়ন এবং নিয়মিত মানবিক সহায়তার জন্য সাধারণ স্থায়ী কল্যাণ তহবিল।",
      targetAmount: 500000,
      currentBalance: 78500,
      contactPerson: "মুহাম্মাদ রেজওয়ানুল হক",
      contactPhone: "01711000002",
      rules: `### সদকায়ে যারিয়াহ ও বন্ধু কল্যাণ ফান্ড নীতিমালা

১. **মাসিক অনুদান প্রতিশ্রুতি:** প্রত্যেক সদস্য তার সাধ্যানুযায়ী প্রতি মাসে ন্যূনতম ২০০/- টাকা বা তদূর্ধ্ব হারে এই তহবিলে নিয়মিত চাঁদা জমা করবেন।
২. **জমা দেওয়ার সময়:** প্রতি ইংরেজি মাসের ১ থেকে ১০ তারিখের মধ্যে চলতি মাসের কিস্তি নির্ধারিত বিকাশ, নগদ বা ব্যাংক একাউন্টে প্রেরণ করতে হবে।
৩. **অর্থের ব্যবহার:**
   - কোনো বন্ধুর আকস্মিক আর্থিক বিপর্যয় বা জরুরি প্রয়োজনে সুদবিহীন করজে হাসানা বা অনুদান।
   - সামাজিক কল্যাণ ও সদকায়ে যারিয়াহ প্রকল্প (যেমন: সুপেয় পানির নলকূপ, কোরআন বিতরণ, দরিদ্র শিক্ষার্থী ফান্ড)।
৪. **স্বচ্ছতা ও জবাবদিহিতা:** সকল জমা এবং খরচের ভাউচার পোর্টালে ডিজিটাল লেজারে উন্মুক্ত থাকবে। প্রতি কোয়ার্টারে পূর্ণাঙ্গ অডিট প্রতিবেদন প্রকাশ করা হবে।`,
      bankDetails: `বিকাশ (পার্সোনাল): 01711-000002 (রেজওয়ান)
নগদ (পার্সোনাল): 01711-000003 (মাহমুদ)
ব্যাংক একাউন্ট:
ব্যাংকের নাম: ইসলামী ব্যাংক বাংলাদেশ পিএলসি, খুলনা শাখা
হিসাবের নাম: Dakhil 2012 Welfare Fund
হিসাব নম্বর: 20501450200001212`,
      createdById: admin.id,
      isActive: true,
    },
  });

  const fund2 = await prisma.fund.create({
    data: {
      title: "জরুরি চিকিৎসা ও দুর্বিপাক সহায়তা তহবিল",
      slug: "emergency-medical-relief",
      description: "ব্যাচমেট বা তাদের পিতা-মাতা ও পরিবারের আকস্মিক জটিল রোগব্যাধি, এক্সিডেন্ট বা জরুরি অপারেশনের তাৎক্ষণিক ব্যয়ভার বহনে আপৎকালীন জরুরি তহবিল।",
      targetAmount: 300000,
      currentBalance: 42000,
      contactPerson: "হাফেজ মাওলানা মাহমুদ হাসান",
      contactPhone: "01711000003",
      rules: `### জরুরি চিকিৎসা সহায়তা নীতিমালা

১. **তাৎক্ষণিক আবেদন:** বন্ধু বা পরিবারের যেকোনো সদস্য হোয়াটসঅ্যাপ বা এই পোর্টালে প্রেসক্রিপশন ও প্রাক্কলিত ব্যয়সহ বার্তা পাঠাবেন।
২. **দ্রুত অনুমোদন:** আবেদন পাওয়ার সর্বোচ্চ ২৪ ঘণ্টার মধ্যে তহবিল কমিটি যাচাই সাপেক্ষে অর্থ ছাড় করবে।
৩. **গোপনীয়তা:** সহায়তাপ্রাপ্ত বন্ধুর আত্মসম্মান রক্ষার্থে গোপনীয়তা কঠোরভাবে রক্ষা করা হবে।`,
      bankDetails: `জরুরি হটলাইন: 01711-000003 (মাহমুদ)
বিকাশ মার্চেন্ট: 01711-000002
নগদ: 01711-000003`,
      createdById: admin.id,
      isActive: true,
    },
  });

  const fund3 = await prisma.fund.create({
    data: {
      title: "বার্ষিক ব্যাচ পুনর্মিলনী ও ইফতার তহবিল",
      slug: "reunion-iftar-fund",
      description: "পবিত্র মাহে রমজানে খুলনায় ব্যাচের সকল বন্ধুদের নিয়ে বার্ষিক ইফতার মাহফিল ও মিলনমেলার সার্বিক আয়োজন তহবিল।",
      targetAmount: 120000,
      currentBalance: 35000,
      contactPerson: "মাওলানা তানভীর আহমেদ",
      contactPhone: "01711000001",
      rules: `### পুনর্মিলনী তহবিলের শর্তাবলী

১. ইফতার ও পুনর্মিলনীর জনপ্রতি রেজিস্ট্রেশন ফি ৫০০/- টাকা। অতিরিক্ত অনুদান ঐচ্ছিক।
২. সংগৃহীত অর্থ দিয়ে ভেন্যু ভাড়া, উন্নত মানের ইফতার-খাবার এবং স্মারক উপহার প্রস্তুত করা হবে।`,
      bankDetails: `বিকাশ / নগদ: 01711-000001 (তানভীর)`,
      createdById: admin.id,
      isActive: true,
    },
  });

  // Assign Fund Managers
  await prisma.fundManager.createMany({
    data: [
      { fundId: fund1.id, userId: manager1.id },
      { fundId: fund1.id, userId: manager2.id },
      { fundId: fund2.id, userId: manager2.id },
      { fundId: fund3.id, userId: admin.id },
      { fundId: fund3.id, userId: manager1.id },
    ],
  });

  // 5. Commitments
  const allUsers = [admin, manager1, manager2, ...createdMembers];
  const commitmentAmounts = [500, 1000, 2000, 500, 1000, 500, 300, 500, 1000, 2000];

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const amount = commitmentAmounts[i % commitmentAmounts.length];
    await prisma.fundCommitment.create({
      data: {
        fundId: fund1.id,
        userId: user.id,
        committedAmount: amount,
        startMonth: "অক্টোবর-২৬",
        status: CommitmentStatus.ACTIVE,
      },
    });

    if (i % 2 === 0) {
      await prisma.fundCommitment.create({
        data: {
          fundId: fund2.id,
          userId: user.id,
          committedAmount: 300,
          startMonth: "অক্টোবর-২৬",
          status: CommitmentStatus.ACTIVE,
        },
      });
    }
  }

  // 6. Monthly Contributions (Dynamic spreadsheet rows for অক্টোবর-২৬, নভেম্বর-২৬, ডিসেম্বর-২৬)
  const months = ["অক্টোবর-২৬", "নভেম্বর-২৬", "ডিসেম্বর-২৬"];
  const methods = [PaymentMethod.BKASH, PaymentMethod.NAGAD, PaymentMethod.BANK, PaymentMethod.CASH];

  for (let mIdx = 0; mIdx < months.length; mIdx++) {
    const month = months[mIdx];
    for (let uIdx = 0; uIdx < allUsers.length; uIdx++) {
      const user = allUsers[uIdx];
      // For earlier months, most verified. For later months, some pending/unpaid
      if (mIdx === 2 && uIdx > 5) continue; // Not paid yet for ডিসেম্বর

      const method = methods[(uIdx + mIdx) % methods.length];
      const status = mIdx === 2 && uIdx % 3 === 0 ? PaymentStatus.PENDING : PaymentStatus.VERIFIED;
      const amount = commitmentAmounts[uIdx % commitmentAmounts.length];

      await prisma.monthlyContribution.create({
        data: {
          fundId: fund1.id,
          userId: user.id,
          monthYear: month,
          amountPaid: amount,
          paymentMethod: method,
          transactionId: method === PaymentMethod.CASH ? null : `TRX${Math.floor(10000000 + Math.random() * 90000000)}`,
          status,
          verifiedByUserId: status === PaymentStatus.VERIFIED ? manager1.id : null,
          verifiedAt: status === PaymentStatus.VERIFIED ? new Date() : null,
          note: status === PaymentStatus.VERIFIED ? "নিয়মিত চাঁদা প্রাপ্তি নিশ্চিত" : "অনলাইন ট্রানজেকশন সাবমিট করা হয়েছে",
        },
      });
    }
  }

  // 7. Fund Expenses (Disbursements)
  await prisma.fundExpense.createMany({
    data: [
      {
        fundId: fund1.id,
        title: "অসুস্থ বন্ধুর স্বাবলম্বীকরণ প্রজেক্টে সেলাই মেশিন ও প্রাথমিক পণ্য ক্রয়ে অনুদান",
        amount: 18000,
        category: "স্বাবলম্বীকরণ সহায়তা",
        spentDate: new Date("2026-10-15"),
        approvedByUserId: admin.id,
        note: "কমিটির সিদ্ধান্তক্রমে সরাসরি ক্রয় করে হস্তান্তর সম্পন্ন।",
      },
      {
        fundId: fund2.id,
        title: "ব্যাচমেটের পিতার জরুরি হার্ট রিং স্থাপনে তাৎক্ষণিক সহায়তা",
        amount: 25000,
        category: "জরুরি চিকিৎসা",
        spentDate: new Date("2026-10-22"),
        approvedByUserId: manager2.id,
        note: "খুলনা হার্ট ফাউন্ডেশন হাসপাতালে সরাসরি হস্তান্তর।",
      },
      {
        fundId: fund1.id,
        title: "খুলনা আলিয়া মাদ্রাসার এতিম শিক্ষার্থীদের জন্য শীতবস্ত্র ও কোরআন উপহার",
        amount: 12000,
        category: "সদকায়ে যারিয়াহ",
        spentDate: new Date("2026-10-28"),
        approvedByUserId: manager1.id,
        note: "মাদ্রাসা প্রিন্সিপাল মহোদয়ের উপস্থিতিতে বিতরণ অনুষ্ঠিত।",
      },
    ],
  });

  // 8. Notices
  await prisma.notice.createMany({
    data: [
      {
        title: "দাখিল ২০১২ ব্যাচ পোর্টাল ও স্বয়ংক্রিয় কল্যাণ ফান্ড ম্যানেজমেন্টের শুভ সূচনা",
        slug: "launch-of-dakhil-2012-portal",
        content: `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ।

আলহামদুলিল্লাহ! দীর্ঘ প্রতীক্ষার পর আমাদের **খুলনা আলিয়া মাদ্রাসা দাখিল ২০১২ ব্যাচের** অফিসিয়াল অনলাইন পোর্টাল ও ফান্ড ম্যানেজমেন্ট সিস্টেমের উদ্বোধন করা হলো।

### পোর্টালের প্রধান সুবিধাসমূহ:
- **সম্পূর্ণ স্বচ্ছতা:** প্রতিটি তহবিলের মোট সংগ্রহ, বর্তমান স্থিতি এবং প্রতি পয়সার ব্যয়ের বিস্তারিত উন্মুক্ত থাকবে।
- **ব্যক্তিগত ড্যাশবোর্ড:** প্রত্যেক বন্ধু তার দেওয়া চাঁদা ও বকেয়া হিসেব দেখতে ও রসিদ সংরক্ষণ করতে পারবেন।
- **ব্যাচমেট ডিরেক্টরি:** বন্ধুদের যোগাযোগের নম্বর, বর্তমান পেশা এবং রক্তের গ্রুপ সহজে খুঁজে নেওয়ার ব্যবস্থা।

সকল বন্ধুকে দ্রুত রেজিস্ট্রেশন করে প্রোফাইল হালনাগাদ করার জন্য বিনীত অনুরোধ জানানো হচ্ছে।`,
        category: NoticeCategory.GENERAL,
        isPinned: true,
        isPublished: true,
        authorId: admin.id,
      },
      {
        title: "জরুরি নোটিশ: সদকায়ে যারিয়াহ তহবিলের অক্টোবর ও নভেম্বর মাসের চাঁদা পরিশোধের অনুরোধ",
        slug: "urgent-welfare-fund-dues-notice",
        content: `সম্মানিত ২০১২ ব্যাচের ভাইয়েরা,

আমাদের সদকায়ে যারিয়াহ ও বন্ধু কল্যাণ ফান্ডের সহায়তায় এ মাসে একজন বন্ধুর পিতার চিকিৎসা ও কর্মসংস্থানে আর্থিক সহায়তা প্রদান করা হয়েছে।

যাঁদের অক্টোবর ও নভেম্বর মাসের মাসিক কিস্তি এখনো বকেয়া রয়েছে, অনুগ্রহ করে নির্ধারিত বিকাশ বা নগদ নম্বরে পাঠিয়ে পোর্টালের 'চাঁদা জমা দিন' অপশনে ট্রানজেকশন আইডি এন্ট্রি করার জন্য অনুরোধ করছি।`,
        category: NoticeCategory.URGENT,
        isPinned: true,
        isPublished: true,
        authorId: manager1.id,
      },
      {
        title: "আসন্ন রমজানে বার্ষিক পুনর্মিলনী ও ইফতার মাহফিল ২০২৬ প্রস্তুতি সভা",
        slug: "annual-iftar-reunion-meeting-2026",
        content: `আসন্ন পবিত্র রমজান মাসে আমাদের খুলনা আলিয়া প্রাঙ্গণে ঐতিহাসিক মিলনমেলা ও বার্ষিক ইফতার মাহফিল আয়োজন উপলক্ষে আগামী শুক্রবার রাত ৮:৩০ মিনিটে জুম মিটিং অনুষ্ঠিত হবে।

সকল বন্ধুকে উক্ত সভায় উপস্থিত থেকে মূল্যবান পরামর্শ প্রদানের জন্য আমন্ত্রণ জানানো হলো।`,
        category: NoticeCategory.MEETING,
        isPinned: false,
        isPublished: true,
        authorId: manager2.id,
      },
    ],
  });

  // 9. Site Settings (Customizable homepage contents)
  const settingsData = [
    {
      key: "hero_title",
      value: "দাখিল ২০১২ ব্যাচ — খুলনা আলিয়া",
      description: "Homepage Hero Title",
    },
    {
      key: "hero_subtitle",
      value: "একযুগের ভ্রাতৃত্ব, আত্মিক বন্ধন ও পারস্পরিক কল্যাণে অটুট ঐক্য। শতভাগ স্বচ্ছতা ও দায়িত্বশীলতায় পরিচালিত আমাদের কল্যাণ ফান্ড।",
      description: "Homepage Hero Subtitle",
    },
    {
      key: "hero_banner_image",
      value: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop",
      description: "Homepage Hero Banner Image",
    },
    {
      key: "marquee_notice",
      value: "📢 দাখিল ২০১২ ব্যাচের সকল বন্ধুদের প্রোফাইল হালনাগাদ এবং কল্যাণ ফান্ডের মাসিক চাঁদা নিয়মিত পরিশোধের আহ্বান জানানো হচ্ছে।",
      description: "Homepage Running Ticker Notice",
    },
    {
      key: "batch_motto",
      value: "বন্ধুত্বে প্রীতি, সেবায় ঐক্য — খুলনা আলিয়া ২০১২",
      description: "Batch Motto",
    },
    {
      key: "contact_email",
      value: "support@dakhil2012khulna.org",
      description: "Official Contact Email",
    },
    {
      key: "contact_phone",
      value: "+880 1711-000001",
      description: "Official Contact Phone",
    },
  ];

  for (const s of settingsData) {
    await prisma.siteSetting.create({ data: s });
  }

  // 10. Initial Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        action: "CREATE_FUND",
        entityType: "FUND",
        entityId: fund1.id,
        fundId: fund1.id,
        performedByUserId: admin.id,
        details: JSON.stringify({
          title: fund1.title,
          targetAmount: fund1.targetAmount,
          summary: "সদকায়ে যারিয়াহ ও বন্ধু কল্যাণ ফান্ড তৈরি করা হয়েছে।",
        }),
      },
      {
        action: "ASSIGN_MANAGER",
        entityType: "FUND",
        entityId: fund1.id,
        fundId: fund1.id,
        performedByUserId: admin.id,
        details: JSON.stringify({
          managerName: manager1.name,
          role: "FUND_MANAGER",
          summary: "রেজওয়ানুল হককে সদকায়ে যারিয়াহ ফান্ডের ম্যানেজার হিসেবে দায়িত্ব প্রদান করা হয়েছে।",
        }),
      },
      {
        action: "RECORD_EXPENSE",
        entityType: "EXPENSE",
        fundId: fund1.id,
        performedByUserId: manager1.id,
        details: JSON.stringify({
          amount: 18000,
          purpose: "স্বাবলম্বীকরণ প্রজেক্টে অনুদান",
          summary: "অসুস্থ বন্ধুর পরিবারে কর্মসংস্থানে ১৮,০০০ টাকা ব্যয় অনুমোদন।",
        }),
      },
    ],
  });

  // 11. Gallery Items
  await prisma.galleryItem.createMany({
    data: [
      {
        title: "খুলনা আলিয়া ক্যাম্পাস প্রাঙ্গণে স্মৃতিময় আড্ডা",
        imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
        caption: "মাদ্রাসা চত্বরে বন্ধুদের মিলনমেলা ও স্মৃতিচারণ।",
        eventDate: "২০২৪",
        category: "পুনর্মিলনী",
      },
      {
        title: "বার্ষিক ইফতার ও দোয়া মাহফিল",
        imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop",
        caption: "খুলনা শহরের একটি রেস্তোরাঁয় ২০১২ ব্যাচের বন্ধুদের স্বতঃস্ফূর্ত অংশগ্রহণ।",
        eventDate: "২০২৫",
        category: "ইফতার মাহফিল",
      },
      {
        title: "শীতবস্ত্র বিতরণ ও মানবিক সহায়তা কর্মসূচি",
        imageUrl: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800&auto=format&fit=crop",
        caption: "আমাদের কল্যাণ তহবিলের অর্থায়নে অসচ্ছলদের মাঝে সহায়তা বিতরণ।",
        eventDate: "২০২৬",
        category: "সমাজসেবা",
      },
    ],
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
