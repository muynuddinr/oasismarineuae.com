// /**
//  * MongoDB to Supabase Migration Script
//  * 
//  * This script migrates all data from MongoDB to Supabase.
//  * Run: npx tsx scripts/migrate-to-supabase.ts
//  */

// // import { MongoClient, ObjectId } from 'mongodb';
// import { createClient } from '@supabase/supabase-js';

// // Configuration - Update these with your credentials
// const MONGODB_URI = process.env.DATABASE_URL || "mongodb+srv://OasisMarine:OasisMarine0011@cluster0.vpkte5g.mongodb.net/oasismarineuae?authSource=admin&retryWrites=true&w=majority";
// const MONGODB_DB = 'oasismarineuae';

// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mwfdlskkkgmzmqcawcji.supabase.co';
// const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZmRsc2tra2dtem1xY2F3Y2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU4MjEyNywiZXhwIjoyMDgzMTU4MTI3fQ.MKgMuZpUJYVoWacuaQ85v45c0cdRjNxSQJNMQ8mWoV4';

// // Initialize clients
// const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// // ID mapping to convert MongoDB ObjectIds to Supabase UUIDs
// interface IdMap {
//   [mongoId: string]: string; // maps mongo _id to supabase uuid
// }

// const idMaps: {
//   users: IdMap;
//   categories: IdMap;
//   subcategories: IdMap;
//   products: IdMap;
//   contacts: IdMap;
// } = {
//   users: {},
//   categories: {},
//   subcategories: {},
//   products: {},
//   contacts: {}
// };

// async function connectMongo(): Promise<{ client: MongoClient; db: any }> {
//   console.log('📦 Connecting to MongoDB...');
//   const client = new MongoClient(MONGODB_URI);
//   await client.connect();
//   const db = client.db(MONGODB_DB);
//   console.log('✅ Connected to MongoDB');
//   return { client, db };
// }

// async function migrateUsers(db: any) {
//   console.log('\n👤 Migrating users...');
//   const users = await db.collection('users').find({}).toArray();
//   console.log(`   Found ${users.length} users`);

//   for (const user of users) {
//     const mongoId = user._id.toString();
    
//     const { data, error } = await supabase
//       .from('users')
//       .insert({
//         mongo_id: mongoId,
//         name: user.name || null,
//         email: user.email || null,
//         email_verified: user.emailVerified || null,
//         image: user.image || null,
//         role: user.role || 'user',
//         created_at: user.createdAt || new Date().toISOString(),
//         updated_at: user.updatedAt || new Date().toISOString()
//       })
//       .select('id')
//       .single();

//     if (error) {
//       console.error(`   ❌ Error inserting user ${mongoId}:`, error.message);
//     } else if (data) {
//       idMaps.users[mongoId] = data.id;
//       console.log(`   ✅ Migrated user: ${user.email || mongoId}`);
//     }
//   }
  
//   console.log(`   ✅ Users migration complete: ${Object.keys(idMaps.users).length} migrated`);
// }

// async function migrateCategories(db: any) {
//   console.log('\n📁 Migrating categories...');
//   const categories = await db.collection('categories').find({}).toArray();
//   console.log(`   Found ${categories.length} categories`);

//   for (const category of categories) {
//     const mongoId = category._id.toString();
    
//     const { data, error } = await supabase
//       .from('categories')
//       .insert({
//         mongo_id: mongoId,
//         name: category.name,
//         href: category.href,
//         is_category: category.isCategory ?? true,
//         visible: category.visible ?? true,
//         order: category.order ?? 0,
//         image: category.image || null,
//         created_at: category.createdAt || new Date().toISOString(),
//         updated_at: category.updatedAt || new Date().toISOString()
//       })
//       .select('id')
//       .single();

//     if (error) {
//       console.error(`   ❌ Error inserting category ${category.name}:`, error.message);
//     } else if (data) {
//       idMaps.categories[mongoId] = data.id;
//       console.log(`   ✅ Migrated category: ${category.name}`);
//     }
//   }
  
//   console.log(`   ✅ Categories migration complete: ${Object.keys(idMaps.categories).length} migrated`);
// }

// async function migrateSubcategories(db: any) {
//   console.log('\n📂 Migrating subcategories...');
//   const subcategories = await db.collection('subcategories').find({}).toArray();
//   console.log(`   Found ${subcategories.length} subcategories`);

//   for (const subcategory of subcategories) {
//     const mongoId = subcategory._id.toString();
//     const categoryMongoId = subcategory.categoryId?.toString();
//     const categoryId = categoryMongoId ? idMaps.categories[categoryMongoId] : null;
    
//     const { data, error } = await supabase
//       .from('subcategories')
//       .insert({
//         mongo_id: mongoId,
//         name: subcategory.name,
//         href: subcategory.href,
//         category_id: categoryId,
//         visible: subcategory.visible ?? true,
//         order: subcategory.order ?? 0,
//         image: subcategory.image || null,
//         created_at: subcategory.createdAt || new Date().toISOString(),
//         updated_at: subcategory.updatedAt || new Date().toISOString()
//       })
//       .select('id')
//       .single();

//     if (error) {
//       console.error(`   ❌ Error inserting subcategory ${subcategory.name}:`, error.message);
//     } else if (data) {
//       idMaps.subcategories[mongoId] = data.id;
//       console.log(`   ✅ Migrated subcategory: ${subcategory.name}`);
//     }
//   }
  
//   console.log(`   ✅ Subcategories migration complete: ${Object.keys(idMaps.subcategories).length} migrated`);
// }

// async function migrateProducts(db: any) {
//   console.log('\n📦 Migrating products...');
//   const products = await db.collection('products').find({}).toArray();
//   console.log(`   Found ${products.length} products`);

//   let migrated = 0;
//   for (const product of products) {
//     const mongoId = product._id.toString();
//     const categoryMongoId = product.categoryId?.toString();
//     const subcategoryMongoId = product.subcategoryId?.toString();
    
//     const categoryId = categoryMongoId ? idMaps.categories[categoryMongoId] : null;
//     const subcategoryId = subcategoryMongoId ? idMaps.subcategories[subcategoryMongoId] : null;
    
//     const { data, error } = await supabase
//       .from('products')
//       .insert({
//         mongo_id: mongoId,
//         name: product.name,
//         slug: product.slug || null,
//         short_description: product.shortDescription || null,
//         long_description: product.longDescription || null,
//         card_image: product.cardImage || null,
//         detail_images: product.detailImages || [],
//         short_features: product.shortFeatures || [],
//         specifications: product.specifications || {},
//         reviews_data: product.reviewsData || {},
//         catalog_file: product.catalogFile || null,
//         category_id: categoryId,
//         subcategory_id: subcategoryId,
//         is_active: product.isActive ?? true,
//         view_count: product.viewCount || 0,
//         created_at: product.createdAt || new Date().toISOString(),
//         updated_at: product.updatedAt || new Date().toISOString()
//       })
//       .select('id')
//       .single();

//     if (error) {
//       console.error(`   ❌ Error inserting product ${product.name}:`, error.message);
//     } else if (data) {
//       idMaps.products[mongoId] = data.id;
//       migrated++;
//       if (migrated % 10 === 0) {
//         console.log(`   📦 Migrated ${migrated} products...`);
//       }
//     }
//   }
  
//   console.log(`   ✅ Products migration complete: ${Object.keys(idMaps.products).length} migrated`);
// }

// async function migrateContacts(db: any) {
//   console.log('\n📞 Migrating contacts...');
//   const contacts = await db.collection('contacts').find({}).toArray();
//   console.log(`   Found ${contacts.length} contacts`);

//   for (const contact of contacts) {
//     const mongoId = contact._id.toString();
//     const userMongoId = contact.userId?.toString();
//     const productMongoId = contact.productId?.toString();
    
//     const userId = userMongoId ? idMaps.users[userMongoId] : null;
//     const productId = productMongoId ? idMaps.products[productMongoId] : null;
    
//     const { data, error } = await supabase
//       .from('contacts')
//       .insert({
//         mongo_id: mongoId,
//         name: contact.name,
//         email: contact.email,
//         phone: contact.phone || null,
//         subject: contact.subject,
//         message: contact.message,
//         status: contact.status || 'new',
//         priority: contact.priority || 'medium',
//         user_id: userId,
//         product_id: productId,
//         product_name: contact.productName || null,
//         product_image: contact.productImage || null,
//         enquiry_type: contact.enquiryType || 'general',
//         created_at: contact.createdAt || new Date().toISOString(),
//         updated_at: contact.updatedAt || new Date().toISOString(),
//         replied_at: contact.repliedAt || null
//       })
//       .select('id')
//       .single();

//     if (error) {
//       console.error(`   ❌ Error inserting contact ${contact.email}:`, error.message);
//     } else if (data) {
//       idMaps.contacts[mongoId] = data.id;
//       console.log(`   ✅ Migrated contact: ${contact.email}`);
//     }
//   }
  
//   console.log(`   ✅ Contacts migration complete: ${Object.keys(idMaps.contacts).length} migrated`);
// }

// async function migrateContactSubmissions(db: any) {
//   console.log('\n📝 Migrating contact submissions...');
//   const submissions = await db.collection('contact_submissions').find({}).toArray();
//   console.log(`   Found ${submissions.length} contact submissions`);

//   let migrated = 0;
//   for (const submission of submissions) {
//     const mongoId = submission._id.toString();
    
//     const { data, error } = await supabase
//       .from('contact_submissions')
//       .insert({
//         mongo_id: mongoId,
//         name: submission.name,
//         email: submission.email,
//         subject: submission.subject,
//         message: submission.message,
//         status: submission.status || 'new',
//         priority: submission.priority || 'medium',
//         source: submission.source || null,
//         ip_address: submission.ipAddress || null,
//         user_agent: submission.userAgent || null,
//         created_at: submission.createdAt || new Date().toISOString(),
//         updated_at: submission.updatedAt || new Date().toISOString(),
//         replied_at: submission.repliedAt || null
//       })
//       .select('id')
//       .single();

//     if (error) {
//       console.error(`   ❌ Error inserting submission ${submission.email}:`, error.message);
//     } else if (data) {
//       migrated++;
//       console.log(`   ✅ Migrated submission: ${submission.email}`);
//     }
//   }
  
//   console.log(`   ✅ Contact submissions migration complete: ${migrated} migrated`);
// }

// async function saveIdMappings() {
//   console.log('\n💾 Saving ID mappings...');
//   const fs = await import('fs').then(m => m.promises);
//   await fs.writeFile(
//     './scripts/id-mappings.json',
//     JSON.stringify(idMaps, null, 2)
//   );
//   console.log('   ✅ ID mappings saved to scripts/id-mappings.json');
// }

// async function main() {
//   console.log('🚀 Starting MongoDB to Supabase Migration\n');
//   console.log('='.repeat(50));
  
//   let mongoClient: MongoClient | null = null;
  
//   try {
//     // Connect to MongoDB
//     const { client, db } = await connectMongo();
//     mongoClient = client;
    
//     // Migrate in order (respecting foreign key dependencies)
//     await migrateUsers(db);
//     await migrateCategories(db);
//     await migrateSubcategories(db);
//     await migrateProducts(db);
//     await migrateContacts(db);
//     await migrateContactSubmissions(db);
    
//     // Save ID mappings for reference
//     await saveIdMappings();
    
//     console.log('\n' + '='.repeat(50));
//     console.log('✅ Migration completed successfully!');
//     console.log('\nSummary:');
//     console.log(`   Users: ${Object.keys(idMaps.users).length}`);
//     console.log(`   Categories: ${Object.keys(idMaps.categories).length}`);
//     console.log(`   Subcategories: ${Object.keys(idMaps.subcategories).length}`);
//     console.log(`   Products: ${Object.keys(idMaps.products).length}`);
//     console.log(`   Contacts: ${Object.keys(idMaps.contacts).length}`);
    
//   } catch (error) {
//     console.error('\n❌ Migration failed:', error);
//     process.exit(1);
//   } finally {
//     if (mongoClient) {
//       await mongoClient.close();
//       console.log('\n📦 MongoDB connection closed');
//     }
//   }
// }

// // Run migration
// main();
