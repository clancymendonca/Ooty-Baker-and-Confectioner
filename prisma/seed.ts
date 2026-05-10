import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Clearing existing data...');
  await prisma.businessInquiryHistory.deleteMany();
  await prisma.businessInquiryProduct.deleteMany();
  await prisma.businessInquiry.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Seed Users
  console.log('👤 Seeding users...');
  // Using the existing password hash from your SQL file
  // If you want to set a new password, uncomment the line below and comment the hash line
  // const hashedPassword = await bcrypt.hash('your-new-password', 12);
  const hashedPassword = '$2y$10$o2tZLhRycyCjp8YCoaamKOfMSExZZB/KtUedVr994hOYi5mhrmujm'; // Original password hash
  await prisma.user.create({
    data: {
      email: 'clancymendonca@gmail.com',
      password: hashedPassword,
      otpCode: null,
      otpExpiry: null,
    },
  });

  // Seed Products
  console.log('🍬 Seeding products...');
  const products = [
    {
      name: 'Almond Delight',
      description: 'Delicious almond-based candy in container packaging',
      imagePath: '/uploads/images/candy1.jpg',
      price: 80.00,
      variety: 'Coated Candy',
      pricePerGram: 0.80,
      vegStatus: 'Veg',
    },
    {
      name: 'Ginger Candy',
      description: 'Spicy ginger flavored candy',
      imagePath: '/uploads/images/candy1.jpg',
      price: 20.00,
      variety: 'Candy',
      pricePerGram: 0.40,
      vegStatus: 'Veg',
    },
    {
      name: 'Jeera Sweet',
      description: 'Cumin flavored traditional sweet',
      imagePath: '/uploads/images/candy1.jpg',
      price: 28.00,
      variety: 'Candy',
      pricePerGram: 0.28,
      vegStatus: 'Veg',
    },
    {
      name: 'Lemon Candy',
      description: 'Tangy lemon flavored candy',
      imagePath: '/uploads/images/candy1.jpg',
      price: 35.00,
      variety: 'Candy',
      pricePerGram: 0.35,
      vegStatus: 'Veg',
    },
    {
      name: 'Orange Candy',
      description: 'Sweet orange flavored candy',
      imagePath: '/uploads/images/candy1.jpg',
      price: 35.00,
      variety: 'Candy',
      pricePerGram: 0.35,
      vegStatus: 'Non-Veg',
    },
    {
      name: 'Orange Candy',
      description: 'Sweet orange flavored candy',
      imagePath: '/uploads/images/candy1.jpg',
      price: 25.00,
      variety: 'Candy',
      pricePerGram: 0.25,
      vegStatus: 'Veg',
    },
    {
      name: 'Sweet Pearl',
      description: 'Classic pearl-shaped candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 25.00,
      variety: 'Coated Candy',
      pricePerGram: 0.25,
      vegStatus: 'Veg',
    },
    {
      name: 'Melon Dews',
      description: 'Refreshing melon flavored candy',
      imagePath: '/uploads/images/candy1.jpg',
      price: 15.00,
      variety: 'Candy',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Rainbow Sticks',
      description: 'Colorful stick candies in a box',
      imagePath: '/uploads/images/candy1.jpg',
      price: 30.00,
      variety: 'Candy',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Peanut Sweet',
      description: 'Sweet peanut-based confectionery',
      imagePath: '/uploads/images/candy1.jpg',
      price: 28.00,
      variety: 'Coated Candy',
      pricePerGram: 0.28,
      vegStatus: 'Non-Veg',
    },
    {
      name: 'Sugar Dots',
      description: 'Colorful sugar dot candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 175.00,
      variety: 'Coated Candy',
      pricePerGram: 0.88,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Jems',
      description: 'Assorted jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 30.00,
      variety: 'Jelly',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Cubes',
      description: 'Cube-shaped jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 15.00,
      variety: 'Jelly',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Curles',
      description: 'Curly shaped jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 15.00,
      variety: 'Jelly',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Diamond',
      description: 'Diamond-shaped jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 15.00,
      variety: 'Jelly',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Fingers',
      description: 'Finger-shaped jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 45.00,
      variety: 'Jelly',
      pricePerGram: 0.45,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Fingers',
      description: 'Finger-shaped jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 15.00,
      variety: 'Jelly',
      pricePerGram: 0.30,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Orange Delight',
      description: 'Orange flavored jelly delight',
      imagePath: '/uploads/images/candy1.jpg',
      price: 42.00,
      variety: 'Jelly',
      pricePerGram: 0.42,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Rounds',
      description: 'Round jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 35.00,
      variety: 'Jelly',
      pricePerGram: 0.35,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Rounds with ring',
      description: 'Round jelly candies with rings',
      imagePath: '/uploads/images/candy1.jpg',
      price: 35.00,
      variety: 'Jelly',
      pricePerGram: 0.35,
      vegStatus: 'Veg',
    },
    {
      name: 'Jelly Sweet Hearts',
      description: 'Heart-shaped jelly candies',
      imagePath: '/uploads/images/candy1.jpg',
      price: 42.00,
      variety: 'Coated Candy',
      pricePerGram: 0.40,
      vegStatus: 'Non-Veg',
    },
    {
      name: 'Dino Candy',
      description: 'fa',
      imagePath: '/uploads/images/68450e5f34339_brand-logo-removebg-preview.png',
      price: 42.00,
      variety: 'Jelly',
      pricePerGram: 42.00,
      vegStatus: 'Non-Veg',
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) => prisma.product.create({ data: product }))
  );

  // Seed Business Inquiries
  console.log('📋 Seeding business inquiries...');
  const inquiry1 = await prisma.businessInquiry.create({
    data: {
      businessName: 'St Josephs University',
      contactPersonName: 'CLANCY MENDONCA',
      email: 'clancy.mendonca@student.sju.edu.in',
      phone: '7625025705',
      estimatedQuantity: '20kg',
      deliveryFrequency: 'Weekly',
      address: '36, Langford Rd',
      additionalNotes: 'nopw',
      businessNature: 'Consumer',
      status: 'inProgress',
      staffNote: '',
      isDeleted: true,
      deletedAt: new Date('2025-06-03T11:35:55Z'),
    },
  });

  const inquiry2 = await prisma.businessInquiry.create({
    data: {
      businessName: 'St Joseph University',
      contactPersonName: 'CLANCY MENDONCA',
      email: 'clancy.mendonca@student.sju.edu.in',
      phone: '7625025705',
      estimatedQuantity: '20kg',
      deliveryFrequency: 'Weekly',
      address: '36, Langford Rd',
      additionalNotes: 'nopw',
      businessNature: 'Consumer',
      status: 'cancelled',
      staffNote: '',
    },
  });

  // Seed Business Inquiry Products
  console.log('🔗 Linking products to inquiries...');
  await prisma.businessInquiryProduct.createMany({
    data: [
      { inquiryId: inquiry1.id, productId: createdProducts[7].id }, // Orange Candy (id 8 in original)
      { inquiryId: inquiry1.id, productId: createdProducts[8].id }, // Rainbow Sticks (id 13)
      { inquiryId: inquiry1.id, productId: createdProducts[9].id }, // Peanut Sweet (id 14)
      { inquiryId: inquiry1.id, productId: createdProducts[12].id }, // Jelly Curles (id 19)
      { inquiryId: inquiry1.id, productId: createdProducts[16].id }, // Jelly Orange Delight (id 23)
      { inquiryId: inquiry2.id, productId: createdProducts[7].id }, // Orange Candy (id 8)
    ],
  });

  // Seed Business Inquiry History
  console.log('📜 Seeding inquiry history...');
  await prisma.businessInquiryHistory.create({
    data: {
      inquiryId: inquiry1.id,
      status: 'cancelled',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${createdProducts.length} products created`);
  console.log(`   - 1 user created`);
  console.log(`   - 2 business inquiries created`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
